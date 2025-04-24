<template>
  <div class="mobile-picture-list">
    <!-- 移动端瀑布流布局容器 -->
    <div class="mobile-masonry-wrapper">
      <!-- 初始加载状态覆盖层 -->
      <div v-if="loading" class="initial-loading-overlay">
        <a-spin size="large">
          <template #indicator>
            <LoadingOutlined style="font-size: 36px; color: #53a9ff;" spin />
          </template>
        </a-spin>
      </div>

      <!-- 瀑布流网格，初始加载完成前隐藏 -->
      <div class="mobile-masonry-grid" v-show="!loading">
        <!-- 固定为两列 -->
        <div v-for="(column, columnIndex) in columns" :key="columnIndex" class="mobile-masonry-column">
          <!-- 渲染列中的每一个图片项 -->
          <div
            v-for="picture in column"
            :key="picture.id"
            class="mobile-masonry-item"
            @click="doClickPicture(picture)"
          >
            <!-- 图片容器，用于保持宽高比 -->
            <div class="image-wrapper">
              <div
                class="aspect-ratio-box"
                :style="{ paddingTop: `${(1 / (picture.picScale || 1)) * 100}%` }"
              >
                <!-- 实际图片 -->
                <img
                  :alt="picture.name"
                  class="masonry-image"
                  :src="picture.thumbnailUrl || picture.url"
                  @load="handleImageLoad"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 加载更多状态提示 -->
      <div v-if="isLoadingMore" class="loading-more-wrapper">
        <a-spin>
          <template #indicator>
            <LoadingOutlined style="font-size: 24px; color: #53a9ff;" spin />
          </template>
          <span style="margin-left: 8px; color: #999;">加载中...</span>
        </a-spin>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { LoadingOutlined } from '@ant-design/icons-vue';
import { ref, computed } from 'vue';

// --- 组件 Props 定义 ---
interface Props {
  dataList?: API.PictureVO[];       // 图片数据数组
  loading?: boolean;                // 是否处于初始加载状态
  isLoadingMore?: boolean;          // 是否正在加载更多
}

// --- 设置 Props 默认值 ---
const props = withDefaults(defineProps<Props>(), {
  dataList: () => [],
  loading: false,
  isLoadingMore: false,
});

// --- Vue Router 实例 ---
const router = useRouter();

// --- 事件处理函数 ---

/**
 * 点击图片卡片，跳转至图片详情页
 * @param picture - 被点击的图片对象
 */
const doClickPicture = (picture: API.PictureVO) => {
  router.push({
    path: `/picture/${picture.id}`,
  });
};

/**
 * 图片加载完成后的处理函数，用于实现图片的淡入效果
 * @param event - 图片加载事件对象
 */
const handleImageLoad = (event: Event) => {
  const imgElement = event.target as HTMLImageElement;
  if (imgElement) {
    setTimeout(() => {
      imgElement.style.opacity = '1';
    }, 50); // 延迟以获得更好的视觉效果
  }
};

// --- 瀑布流布局计算逻辑 ---

// 移动端固定为 2 列
const columnCount = ref(2);

/**
 * 计算属性，将传入的 dataList 数据分配到两个列中
 * @returns 一个二维数组，包含两个子数组，代表两列的图片数据
 */
const columns = computed(() => {
  const count = columnCount.value;
  const cols: API.PictureVO[][] = Array.from({ length: count }, () => []);
  props.dataList.forEach((item, index) => {
    const columnIndex = index % count; // 按索引分配到 0 或 1 列
    cols[columnIndex].push(item);
  });
  return cols;
});

</script>

<style scoped>
.mobile-picture-list {
  padding: 4px; /* 列表外边距 */
  width: 100%;
  margin: 0 auto;
}

.mobile-masonry-wrapper {
  width: 100%;
  min-height: 100vh; /* 保证容器至少有一屏高 */
  padding: 0;
  position: relative; /* 用于初始加载覆盖层的绝对定位 */
}

/* 初始加载状态的半透明覆盖层 */
.initial-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  min-height: 300px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 10;
}

/* 瀑布流网格容器 */
.mobile-masonry-grid {
  display: flex;
  gap: 8px; /* 列之间的间距 (移动端可以小一点) */
  width: 100%;
  padding: 0;
  margin: 0;
}

/* 瀑布流的列 */
.mobile-masonry-column {
  flex: 1; /* 列平分宽度 */
  display: flex;
  flex-direction: column;
  gap: 8px; /* 列内图片之间的间距 (移动端可以小一点) */
  min-width: 0;
}

/* 瀑布流的单个图片项 */
.mobile-masonry-item {
  width: 100%;
  margin: 0;
  break-inside: avoid;
  border-radius: 8px; /* 移动端圆角可以小一点 */
  overflow: hidden;
  position: relative;
  cursor: pointer; /* 明确可点击 */
  background: #f0f2f5; /* 图片加载前的占位背景色 */
  /* 移动端可以加一个细边框增加区分度 */
  /* border: 1px solid #eee; */
  transition: transform 0.2s ease-out; /* 轻微的点击反馈 */
}
.mobile-masonry-item:active {
  transform: scale(0.98); /* 点击时缩小一点 */
}


/* 图片容器 */
.image-wrapper {
  position: relative;
  width: 100%;
  overflow: hidden;
  display: block; /* 确保 image-wrapper 是块级元素 */
}

/* 用于维持图片宽高比的容器 */
.aspect-ratio-box {
  position: relative;
  width: 100%;
  height: 0; /* 高度由 padding-top 控制 */
  background: #f0f2f5; /* 占位背景色 */
}

/* 实际图片样式 */
.masonry-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0; /* 初始透明，用于淡入效果 */
  transition: opacity 0.3s ease-in-out;
  will-change: opacity;
  display: block; /* 消除图片底部可能的空白间隙 */
}

/* 加载更多提示的容器 */
.loading-more-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px 0; /* 移动端内边距可以小一点 */
  width: 100%;
  background: transparent;
}

/* Ant Design Spin 组件样式调整 */
:deep(.ant-spin) {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

:deep(.ant-spin-dot) {
  font-size: 20px; /* 移动端加载图标可以小一点 */
}
</style>
