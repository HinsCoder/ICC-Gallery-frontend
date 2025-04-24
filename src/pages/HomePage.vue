<template>
  <div id="homePage">
    <!-- PC端搜索框 -->
    <div v-if="isPc" class="search-bar">
      <a-input-search
        placeholder="从海量图片中搜索"
        v-model:value="searchParams.searchText"
        enter-button="搜索"
        size="large"
        @search="resetAndLoadFirstPage"
      />
    </div>

    <!-- 移动端搜索框 -->
    <div v-else class="mobile-top-area">
      <!-- Logo 显示区域 -->
      <div class="mobile-logo-container">
        <img class="mobile-logo" src="../assets/homepage-logo.png" alt="云图汇 Logo" />
      </div>
      <!-- 移动端搜索框 -->
      <div class="mobile-search">
        <a-input-search
          placeholder="从海量图片中搜索"
          v-model:value="searchParams.searchText"
          @search="resetAndLoadFirstPage"
        />
      </div>
    </div>

    <!-- PC端分类 + 标签 -->
    <template v-if="isPc">
      <a-tabs v-model:activeKey="selectedCategory" @change="resetAndLoadFirstPage">
        <a-tab-pane key="all" tab="全部" />
        <a-tab-pane v-for="category in categoryList" :key="category" :tab="category" />
      </a-tabs>
      <div class="tag-bar">
        <span style="margin-right: 8px">标签：</span>
        <a-space :size="[0, 8]" wrap>
          <a-checkable-tag
            v-for="(tag, index) in tagList"
            :key="tag"
            v-model:checked="selectedTagList[index]"
            @change="handleTagChange"
          >
            {{ tag }}
          </a-checkable-tag>
        </a-space>
      </div>
    </template>

    <!-- 移动端分类 -->
    <a-tabs v-else v-model:activeKey="selectedCategory" @change="resetAndLoadFirstPage" class="mobile-category-tabs">
      <a-tab-pane key="all" tab="全部" />
      <a-tab-pane v-for="category in categoryList" :key="category" :tab="category" />
    </a-tabs>

    <!-- 图片列表 (根据设备类型选择) -->
    <WaterfallPictureList
      v-if="isPc"
      :dataList="dataList"
      :loading="initialLoading"
      :is-loading-more="isLoadingMore"
      :column-count="pcColumnCount"
    />
    <MobilePictureList
      v-else
      :dataList="dataList"
      :loading="initialLoading"
      :is-loading-more="isLoadingMore"
    />

    <!-- 通用的“没有更多”提示 -->
    <div v-if="!hasMore && dataList.length > 0" class="no-more-data">
      —— 我是有底线的 ——
    </div>

  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref, computed, watch, nextTick } from 'vue'; // 引入 nextTick
import { listPictureTagCategoryUsingGet, listPictureVoByPageUsingPost } from '@/api/pictureController.ts';
import { message } from 'ant-design-vue';
import MobilePictureList from '@/components/MobilePictureList.vue'; // 确保路径正确
import WaterfallPictureList from '@/components/WaterfallPictureList.vue';
import { useWindowSize } from '@vueuse/core';
import throttle from 'lodash/throttle';

// --- 响应式状态定义 ---
const dataList = ref<API.PictureVO[]>([]); // 图片数据列表
const total = ref(0); // 图片总数
const initialLoading = ref(false); // 初始加载状态
const isLoadingMore = ref(false); // 加载更多状态
const hasMore = ref(true); // 是否还有更多数据

// --- 设备判断与列数计算 ---
const { width } = useWindowSize();
const isPc = computed(() => width.value >= 768);

/**
 * 根据当前窗口宽度计算 PC 端瀑布流的列数
 * @returns PC 端的列数
 */
const getPcColumnCount = () => {
  const w = width.value;
  // 根据宽度返回不同的列数，可以调整这里的断点和列数
  if (w > 1920) return 6; // 超宽屏减少列数，让图片更大
  if (w > 1600) return 5;
  if (w > 1400) return 5;
  if (w > 1200) return 4;
  if (w > 900) return 4;
  return 3; // PC 端最小列数
};
// PC 端列数 (响应式)
const pcColumnCount = computed(() => isPc.value ? getPcColumnCount() : 0);

/**
 * 计算动态的 pageSize，用于优化初始加载和后续加载数量
 * @returns 根据设备和列数计算出的每页加载数量
 */
const dynamicPageSize = computed(() => {
  if (isPc.value) {
    // PC 端：列数 * 4 (每列期望加载4行左右)，最小为 12
    return Math.max(pcColumnCount.value * 4, 12);
  } else {
    // 移动端：固定值 10 (两列，每列5行左右)
    return 10;
  }
});

// --- 搜索条件 ---
// Omit 用于创建一个新类型，它排除了原始类型中的某些属性（这里是 pageSize）
const searchParams = reactive<Omit<API.PictureQueryRequest, 'pageSize'>>({
  current: 1,
  sortField: 'createTime',
  sortOrder: 'descend',
  searchText: '',
  category: undefined,
  tags: [],
});

// --- 筛选条件状态 ---
const categoryList = ref<string[]>([]);
const selectedCategory = ref<string>('all');
const tagList = ref<string[]>([]);
const selectedTagList = ref<boolean[]>([]);

// --- 数据加载核心逻辑 ---
/**
 * 加载图片数据函数
 * @param isLoadMore - 布尔值，指示是否为加载更多操作
 */
const loadData = async (isLoadMore = false) => {
  // 防止重复加载
  if ((isLoadMore && isLoadingMore.value) || (!isLoadMore && initialLoading.value)) {
    return;
  }
  // 如果是加载更多，但已无更多数据，则停止
  if (isLoadMore && !hasMore.value) {
    return;
  }

  // 设置加载状态
  if (isLoadMore) {
    isLoadingMore.value = true;
  } else {
    initialLoading.value = true;
  }

  // 准备 API 请求参数, 使用动态 pageSize
  const params: API.PictureQueryRequest = {
    ...searchParams,
    pageSize: dynamicPageSize.value, // 使用计算出的 pageSize
    current: isLoadMore ? searchParams.current + 1 : 1,
    tags: [],
  };
  if (selectedCategory.value !== 'all') {
    params.category = selectedCategory.value;
  } else {
    params.category = undefined;
  }
  selectedTagList.value.forEach((useTag, index) => {
    if (useTag && tagList.value[index]) {
      params.tags.push(tagList.value[index]);
    }
  });
  params.searchText = searchParams.searchText;

  try {
    // 发起 API 请求
    const res = await listPictureVoByPageUsingPost(params);

    if (res.data.data) {
      const newRecords = res.data.data.records ?? [];
      const newTotal = res.data.data.total ?? 0;

      // 更新数据列表和状态
      if (isLoadMore) {
        dataList.value = [...dataList.value, ...newRecords];
        searchParams.current += 1;
      } else {
        dataList.value = newRecords;
        searchParams.current = 1;
        total.value = newTotal;
      }
      // 更新是否还有更多
      hasMore.value = dataList.value.length < total.value;

      // 初始加载完成后，等待 DOM 更新后再检查是否需要加载更多
      if (!isLoadMore) {
        await nextTick();
        checkAndLoadMoreIfNeeded();
      }

    } else {
      message.error('获取数据失败: ' + res.data.message);
      hasMore.value = false;
    }
  } catch (error: any) {
    message.error('请求异常: ' + error.message);
    hasMore.value = false;
  } finally {
    // 重置加载状态
    if (isLoadMore) {
      isLoadingMore.value = false;
    } else {
      initialLoading.value = false;
    }
  }
};

/**
 * 重置搜索条件并加载第一页数据
 */
const resetAndLoadFirstPage = async () => {
  if (initialLoading.value || isLoadingMore.value) {
    return;
  }
  dataList.value = [];
  searchParams.current = 1;
  hasMore.value = true;
  await loadData(false);
};

// --- 筛选条件相关 ---
/**
 * 获取分类和标签选项列表
 */
const getTagCategoryOptions = async () => {
  try {
    const res = await listPictureTagCategoryUsingGet();
    if (res.data.code === 0 && res.data.data) {
      categoryList.value = res.data.data.categoryList ?? [];
      tagList.value = res.data.data.tagList ?? [];
      selectedTagList.value = new Array(tagList.value.length).fill(false);
    } else {
      message.error('加载分类标签失败: ' + res.data.message);
    }
  } catch (error: any) {
    message.error('加载分类标签异常: ' + error.message);
  }
}

/**
 * 标签选中状态改变时的处理函数
 */
const handleTagChange = () => {
  resetAndLoadFirstPage();
}

// --- 无限滚动相关 ---
/**
 * 处理窗口滚动事件的函数 (节流)
 */
const handleScroll = throttle(() => {
  if (isLoadingMore.value || !hasMore.value || initialLoading.value) {
    return;
  }
  const scrollHeight = document.documentElement.scrollHeight;
  const scrollTop = document.documentElement.scrollTop;
  const clientHeight = document.documentElement.clientHeight;
  const threshold = 250; // 增大了触发阈值

  if (scrollHeight - scrollTop - clientHeight < threshold) {
    loadData(true);
  }
}, 300);

/**
 * 检查内容是否填满视口，若未填满且有更多数据，则自动加载下一页
 */
const checkAndLoadMoreIfNeeded = () => {
  // 使用 nextTick 确保在 DOM 更新后执行检查
  nextTick(() => {
    if (isLoadingMore.value || !hasMore.value || initialLoading.value) {
      return;
    }
    // 尝试获取列表容器元素，如果用 ID 可能更精确
    const contentElement = document.getElementById('homePage');
    if (!contentElement) return;

    const contentBottom = contentElement.getBoundingClientRect().bottom;
    const viewportHeight = window.innerHeight; // 使用 window.innerHeight 获取视口高度

    // 如果内容底部仍在视口内或非常接近视口底部 (增加缓冲值)，并且还有更多数据
    if (contentBottom <= viewportHeight + 50 && hasMore.value) {
      loadData(true);
    }
  });
}

// --- 生命周期钩子 ---
/**
 * 组件挂载后执行初始化操作
 */
onMounted(async () => {
  try {
    await getTagCategoryOptions();
    dataList.value = [];
    searchParams.current = 1;
    hasMore.value = true;
    await loadData(false); // 初始加载
  } catch (error) {
    console.error("页面初始化失败:", error);
    message.error("页面初始化失败");
    initialLoading.value = false;
    isLoadingMore.value = false;
  } finally {
    // 初始化流程完成后添加滚动监听器
    window.addEventListener('scroll', handleScroll);
  }
});

/**
 * 组件卸载前移除滚动监听器
 */
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});

// --- 设备切换监听 ---
/**
 * 监听设备类型变化 (PC/Mobile)
 * 切换时重新加载数据
 */
watch(isPc, async (newVal, oldVal) => {
  if (newVal !== oldVal) {
    await resetAndLoadFirstPage();
  }
});

</script>

<style scoped>
#homePage {
  margin-bottom: 16px;
}

/* PC 端搜索框 */
#homePage .search-bar {
  max-width: 480px;
  margin: 0 auto 16px;
}

/* 移动端顶部整体区域 */
.mobile-top-area {
  padding: 16px 16px 8px 16px;
  background-color: #fff;
}

/* 移动端 Logo 容器 */
.mobile-logo-container {
  text-align: center;
  margin-bottom: 12px;
}

/* 移动端 Logo 图片样式 */
.mobile-logo {
  height: 36px;
  vertical-align: middle;
}

/* 移动端搜索框容器 */
.mobile-search :deep(.ant-input-search-button) {
  height: 32px;
}

/* PC 端标签栏 */
#homePage .tag-bar {
  margin-bottom: 16px;
}

/* 移动端分类标签样式 */
.mobile-category-tabs {
  padding: 0 8px;
}
.mobile-category-tabs :deep(.ant-tabs-nav) {
  margin-bottom: 8px;
}
.mobile-category-tabs :deep(.ant-tabs-tab) {
  padding: 8px 12px;
  font-size: 14px;
}
.mobile-category-tabs :deep(.ant-tabs-ink-bar) {
  background-color: #53a9ff;
}

/* 没有更多数据提示 */
.no-more-data {
  text-align: center;
  color: #999;
  padding: 20px 0;
  font-size: 14px;
}
</style>
