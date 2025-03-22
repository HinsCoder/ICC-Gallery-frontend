<template>
  <div class="waterfall-picture-list">
    <!-- PC端瀑布流布局 -->
    <div class="masonry-wrapper">
      <div class="masonry-grid">
        <!-- 使用计算后的列数据进行渲染 -->
        <div v-for="(column, columnIndex) in columns" :key="columnIndex" class="masonry-column">
          <div
            v-for="picture in column"
            :key="picture.id"
            class="masonry-item"
          >
            <a-card hoverable @click="doClickPicture(picture)">
              <template #cover>
                <div class="image-wrapper">
                  <div
                    class="aspect-ratio-box"
                    :style="{ paddingTop: `${(1 / (picture.picScale || 1)) * 100}%` }"
                  >
                    <img
                      :alt="picture.name"
                      class="masonry-image"
                      :src="picture.thumbnailUrl || picture.url"
                      @load="handleImageLoad"
                    />
                  </div>
                </div>
              </template>
              <a-card-meta :title="picture.name">
                <template #description>
                  <a-flex>
                    <a-tag color="green">
                      {{ picture.category ?? '默认' }}
                    </a-tag>
                    <a-tag v-for="tag in picture.tags" :key="tag">
                      {{ tag }}
                    </a-tag>
                  </a-flex>
                </template>
              </a-card-meta>
              <template v-if="showOp" #actions>
                <ShareAltOutlined @click.stop="(e) => doShare(picture, e)" />
                <SearchOutlined @click.stop="(e) => doSearch(picture, e)" />
                <EditOutlined v-if="canEdit" @click.stop="(e) => doEdit(picture, e)" />
                <DeleteOutlined v-if="canDelete" @click.stop="(e) => doDelete(picture, e)" />
              </template>
            </a-card>
          </div>
        </div>
      </div>
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-wrapper">
        <a-spin>
          <template #indicator>
            <LoadingOutlined style="font-size: 24px; color: #53a9ff;" spin />
          </template>
        </a-spin>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
  ShareAltOutlined,
  LoadingOutlined
} from '@ant-design/icons-vue'
import { deletePictureUsingPost } from '@/api/pictureController.ts'
import { message } from 'ant-design-vue'
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Props {
  dataList?: API.PictureVO[]
  loading?: boolean
  showOp?: boolean
  canEdit?: boolean
  canDelete?: boolean
  onReload?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  dataList: () => [],
  loading: false,
  showOp: false,
  canEdit: false,
  canDelete: false,
})

const router = useRouter()

// 跳转至图片详情页
const doClickPicture = (picture: API.PictureVO) => {
  router.push({
    path: `/picture/${picture.id}`,
  })
}

// 搜索
const doSearch = (picture, e) => {
  e.stopPropagation()
  window.open(`/search_picture?pictureId=${picture.id}`)
}

// 编辑
const doEdit = (picture, e) => {
  e.stopPropagation()
  router.push({
    path: '/add_picture',
    query: {
      id: picture.id,
      spaceId: picture.spaceId,
    },
  })
}

// 删除数据
const doDelete = async (picture, e) => {
  e.stopPropagation()
  const id = picture.id
  if (!id) {
    return
  }
  const res = await deletePictureUsingPost({ id })
  if (res.data.code === 0) {
    message.success('删除成功')
    props.onReload?.()
  } else {
    message.error('删除失败')
  }
}

// 图片加载完成处理
const handleImageLoad = (event: Event) => {
  const imgElement = event.target as HTMLImageElement
  if (imgElement) {
    setTimeout(() => {
      imgElement.style.opacity = '1'
    }, 50)
  }
}

// 根据窗口宽度计算列数
const getColumnCount = () => {
  const width = window.innerWidth
  if (width > 1920) return 8
  if (width > 1600) return 7
  if (width > 1400) return 6
  if (width > 1200) return 5
  if (width > 900) return 4
  return 3
}

// 使用响应式变量保存当前列数
const columnCount = ref(getColumnCount())

// 计算分列数据，依赖于 columnCount 与 dataList 的变化
const columns = computed(() => {
  const count = columnCount.value
  const cols: API.PictureVO[][] = Array.from({ length: count }, () => [])
  props.dataList.forEach((item, index) => {
    const columnIndex = index % count
    cols[columnIndex].push(item)
  })
  return cols
})

// 监听窗口大小变化（带节流）
let resizeTimer: number | null = null
const handleResize = () => {
  if (resizeTimer) clearTimeout(resizeTimer)
  resizeTimer = window.setTimeout(() => {
    columnCount.value = getColumnCount()
  }, 200)
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.waterfall-picture-list {
  padding: 4px;
  width: 100%;
  margin: 0 auto;
}

.masonry-wrapper {
  width: 100%;
  min-height: 100vh; /* 至少填满一个屏幕 */
  padding: 0;
}

.masonry-grid {
  display: flex;
  gap: 12px; /* 列间距 */
  width: 100%;
  padding: 0;
  margin: 0;
}

.masonry-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px; /* 图片间距 */
  min-width: 0; /* 避免 flex 溢出 */
}

.masonry-item {
  width: 100%;
  margin: 0;
  break-inside: avoid; /* 防止元素内部断裂 */
  border-radius: 12px;
  overflow: hidden; /* 裁剪超出边界的内容 */
  position: relative; /* 相对定位 */
}

.image-wrapper {
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: 12px 12px 0 0;
  background: #f5f5f5;
}

.aspect-ratio-box {
  position: relative;
  width: 100%;
  height: 0;
  background: #f5f5f5;
}

.masonry-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
  will-change: opacity;
}

.loading-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px 0;
  width: 100%;
  background: transparent;
}

/* 优化加载动画样式 */
:deep(.ant-spin) {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

:deep(.ant-spin-dot) {
  font-size: 24px;
}
</style>
