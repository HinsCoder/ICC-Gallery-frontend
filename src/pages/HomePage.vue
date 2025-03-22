<template>
  <div id="homePage">
    <!-- PC端搜索框 -->
    <div v-if="isPc" class="search-bar">
      <a-input-search
        placeholder="从海量图片中搜索"
        v-model:value="searchParams.searchText"
        enter-button="搜索"
        size="large"
        @search="doSearch"
      />
    </div>

    <!-- 移动端搜索框 -->
    <div v-else class="mobile-search">
      <a-input-search
        placeholder="搜索图片"
        v-model:value="searchParams.searchText"
        @search="doSearch"
      />
    </div>

    <!-- PC端分类 + 标签 -->
    <template v-if="isPc">
      <a-tabs v-model:activeKey="selectedCategory" @change="doSearch">
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
            @change="doSearch"
          >
            {{ tag }}
          </a-checkable-tag>
        </a-space>
      </div>
    </template>

    <!-- 移动端分类 -->
    <a-tabs v-else v-model:activeKey="selectedCategory" @change="doSearch" class="mobile-category-tabs">
      <a-tab-pane key="all" tab="全部" />
      <a-tab-pane v-for="category in categoryList" :key="category" :tab="category" />
    </a-tabs>

    <!-- 图片列表 (根据设备类型选择) -->
    <WaterfallPictureList v-if="isPc" :dataList="dataList" :loading="loading" />
    <MobilePictureList v-else :dataList="dataList" :loading="loading" />


    <!-- PC端分页 -->
    <a-pagination
      v-if="isPc"
      style="text-align: right"
      v-model:current="searchParams.current"
      v-model:pageSize="searchParams.pageSize"
      :total="total"
      @change="onPageChange"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, computed } from 'vue'
import { listPictureTagCategoryUsingGet, listPictureVoByPageUsingPost } from '@/api/pictureController.ts'
import { message } from 'ant-design-vue'
// import PictureList from '@/components/PictureList.vue'  // 移除旧的 PictureList
import MobilePictureList from '@/components/PictureList.vue'
import WaterfallPictureList from '@/components/WaterfallPictureList.vue'
import { useWindowSize } from '@vueuse/core'

// 定义数据
const dataList = ref<API.PictureVO[]>([])
const total = ref(0)
const loading = ref(true)

// 搜索条件
const searchParams = reactive<API.PictureQueryRequest>({
  current: 1,
  pageSize: 12,
  sortField: 'createTime',
  sortOrder: 'descend',
})

// 获取数据
const fetchData = async () => {
  loading.value = true
  const params = {
    ...searchParams,
    tags: [] as string[],
  }
  if (selectedCategory.value !== 'all') {
    params.category = selectedCategory.value
  }
  selectedTagList.value.forEach((useTag, index) => {
    if (useTag) {
      params.tags.push(tagList.value[index])
    }
  })
  const res = await listPictureVoByPageUsingPost(params)
  if (res.data.data) {
    dataList.value = res.data.data.records ?? []
    total.value = res.data.data.total ?? 0
  } else {
    message.error('获取数据失败，' + res.data.message)
  }
  loading.value = false
}

// 页面加载时请求一次
onMounted(() => {
  fetchData()
})

// 分页参数 (仅PC端)
const onPageChange = (page: number, pageSize: number) => {
  searchParams.current = page
  searchParams.pageSize = pageSize
  fetchData()
}

// 搜索
const doSearch = () => {
  searchParams.current = 1
  fetchData()
}

const categoryList = ref<string[]>([])
const selectedCategory = ref<string>('all')
const tagList = ref<string[]>([])
const selectedTagList = ref<boolean[]>([])

// 获取标签和分类选项
const getTagCategoryOptions = async () => {
  const res = await listPictureTagCategoryUsingGet()
  if (res.data.code === 0 && res.data.data) {
    categoryList.value = res.data.data.categoryList ?? []
    tagList.value = res.data.data.tagList ?? []
  } else {
    message.error('加载分类标签失败，' + res.data.message)
  }
}

onMounted(() => {
  getTagCategoryOptions()
})

// 判断是否为PC端
const { width } = useWindowSize()
const isPc = computed(() => width.value >= 768)

</script>

<style scoped>
#homePage {
  margin-bottom: 16px;
}

#homePage .search-bar {
  max-width: 480px;
  margin: 0 auto 16px;
}

#homePage .tag-bar {
  margin-bottom: 16px;
}

/* 移动端分类标签样式 */
.mobile-category-tabs :deep(.ant-tabs-nav) {
  margin-bottom: 0;
}
.mobile-category-tabs :deep(.ant-tabs-tab) {
  padding: 8px 16px;
}
.mobile-category-tabs :deep(.ant-tabs-ink-bar) {
  background-color: #53a9ff;
}
</style>
