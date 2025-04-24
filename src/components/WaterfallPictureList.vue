<template>
  <div class="waterfall-picture-list">
    <!-- PC端瀑布流布局容器 -->
    <div class="masonry-wrapper">
      <!-- 初始加载状态覆盖层 -->
      <div v-if="loading" class="initial-loading-overlay">
        <a-spin size="large">
          <template #indicator>
            <LoadingOutlined style="font-size: 36px; color: #53a9ff;" spin />
          </template>
        </a-spin>
      </div>

      <!-- 瀑布流网格，初始加载完成前隐藏 -->
      <div class="masonry-grid" v-show="!loading">
        <!-- 渲染每一列 -->
        <div v-for="(column, columnIndex) in columns" :key="columnIndex" class="masonry-column">
          <!-- 渲染列中的每一个图片项 -->
          <div
            v-for="picture in column"
            :key="picture.id"
            class="masonry-item"
          >
            <a-card hoverable @click="doClickPicture(picture)">
              <!-- 卡片封面 -->
              <template #cover>
                <div class="image-wrapper">
                  <!-- 使用 padding-top 实现图片宽高比占位 -->
                  <div
                    class="aspect-ratio-box"
                    :style="{ paddingTop: `${(1 / (picture.picScale || 1)) * 100}%` }"
                  >
                    <!-- 实际图片元素 -->
                    <img
                      :alt="picture.name"
                      class="masonry-image"
                      :src="picture.thumbnailUrl || picture.url"
                      @load="handleImageLoad"
                      loading="lazy"
                    />
                  </div>
                </div>
              </template>
              <!-- 卡片元信息（标题、描述） -->
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
              <!-- 卡片操作栏 (可选) -->
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

      <!-- 加载更多状态提示，当 isLoadingMore 为 true 时显示 -->
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
import {
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
  ShareAltOutlined,
  LoadingOutlined
} from '@ant-design/icons-vue';
import { deletePictureUsingPost } from '@/api/pictureController.ts';
import { message } from 'ant-design-vue';
import { ref, computed } from 'vue'; // 移除 onMounted, onUnmounted, watch

// --- 组件 Props 定义 ---
interface Props {
  dataList?: API.PictureVO[];       // 图片数据数组
  loading?: boolean;                // 是否处于初始加载状态
  isLoadingMore?: boolean;          // 是否正在加载更多
  showOp?: boolean;                 // 是否显示操作按钮
  canEdit?: boolean;                // 是否可编辑
  canDelete?: boolean;              // 是否可删除
  onReload?: () => void;            // 删除成功后触发的回调 (可选)
  columnCount?: number;             // 新增：接收父组件计算好的列数
}

// --- 设置 Props 默认值 ---
const props = withDefaults(defineProps<Props>(), {
  dataList: () => [],
  loading: false,
  isLoadingMore: false,
  showOp: false,
  canEdit: false,
  canDelete: false,
  columnCount: 3, // 提供一个默认值
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
 * 点击搜索相似图片按钮
 * @param picture - 图片对象
 * @param e - 事件对象，用于阻止冒泡
 */
const doSearch = (picture: API.PictureVO, e: Event) => {
  e.stopPropagation();
  window.open(`/search_picture?pictureId=${picture.id}`);
};

/**
 * 点击编辑按钮
 * @param picture - 图片对象
 * @param e - 事件对象，用于阻止冒泡
 */
const doEdit = (picture: API.PictureVO, e: Event) => {
  e.stopPropagation();
  router.push({
    path: '/add_picture',
    query: {
      id: picture.id,
      spaceId: picture.spaceId,
    },
  });
};

/**
 * 点击删除按钮，执行删除操作
 * @param picture - 图片对象
 * @param e - 事件对象，用于阻止冒泡
 */
const doDelete = async (picture: API.PictureVO, e: Event) => {
  e.stopPropagation();
  const id = picture.id;
  if (!id) {
    return;
  }
  try {
    const res = await deletePictureUsingPost({ id });
    if (res.data.code === 0) {
      message.success('删除成功');
      props.onReload?.();
    } else {
      message.error('删除失败: ' + res.data.message);
    }
  } catch (error: any) {
    message.error('删除异常: ' + error.message);
  }
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
    }, 50);
  }
};

// --- 瀑布流布局计算逻辑 ---

/**
 * 计算属性，将传入的 dataList 数据分配到父组件指定的列数中
 * @returns 一个二维数组，每个子数组代表一列的图片数据
 */
const columns = computed(() => {
  // 使用父组件传递的 columnCount，确保至少为 1 列
  const count = Math.max(1, props.columnCount || 1);
  const cols: API.PictureVO[][] = Array.from({ length: count }, () => []);
  props.dataList.forEach((item, index) => {
    const columnIndex = index % count;
    cols[columnIndex].push(item);
  });
  return cols;
});

// --- 生命周期钩子 ---
// 不再需要 onMounted 和 onUnmounted 来处理 resize 事件

</script>

<style scoped>
.waterfall-picture-list {
  padding: 4px;
  width: 100%;
  margin: 0 auto;
}

.masonry-wrapper {
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
  min-height: 300px; /* 覆盖层最小高度 */
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 10; /* 确保在内容之上 */
}

/* 瀑布流网格容器 */
.masonry-grid {
  display: flex;
  gap: 12px; /* 列之间的间距 */
  width: 100%;
  padding: 0;
  margin: 0;
}

/* 瀑布流的列 */
.masonry-column {
  flex: 1; /* 列平分宽度 */
  display: flex;
  flex-direction: column;
  gap: 12px; /* 列内图片之间的间距 */
  min-width: 0; /* 防止 flex 布局溢出 */
}

/* 瀑布流的单个图片项 */
.masonry-item {
  width: 100%;
  margin: 0;
  break-inside: avoid; /* 防止元素在列内断开 */
  border-radius: 12px; /* 圆角 */
  overflow: hidden; /* 隐藏超出部分 */
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.09); /* 基础阴影 */
  /* 为悬浮效果添加过渡 */
  transition: transform 0.25s ease-in-out, box-shadow 0.25s ease-in-out;
  will-change: transform, box-shadow; /* 性能优化提示 */
}

/* 鼠标悬浮在图片项上的效果 */
.masonry-item:hover {
  transform: translateY(-5px); /* 轻微上移 */
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15); /* 增强阴影 */
  z-index: 1; /* 确保悬浮时在最上层（可选） */
}

/* 图片容器 */
.image-wrapper {
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: 12px 12px 0 0; /* 顶部圆角 */
  background: #f0f2f5; /* 图片加载前的占位背景色 */
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
  object-fit: cover; /* 保持图片比例填充容器 */
  opacity: 0; /* 初始透明，用于淡入效果 */
  transition: opacity 0.3s ease-in-out; /* 透明度过渡 */
  will-change: opacity; /* 性能优化提示 */
  display: block; /* 消除图片底部可能的空白间隙 */
}

/* 加载更多提示的容器 */
.loading-more-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px 0;
  width: 100%;
  background: transparent;
}

/* Ant Design Spin 组件样式调整 */
:deep(.ant-spin) {
  display: flex;
  flex-direction: row; /* 图标和文字水平排列 */
  align-items: center;
  gap: 8px; /* 图标和文字间距 */
}

:deep(.ant-spin-dot) {
  font-size: 24px; /* 加载图标大小 */
}

/* Ant Design Card 组件内部样式微调 */
:deep(.ant-card-cover) {
  margin: 0; /* 移除封面外边距 */
}
:deep(.ant-card-body) {
  padding: 12px; /* 调整内容区域内边距 */
}
:deep(.ant-card-meta-title) {
  font-size: 14px; /* 标题字号 */
  margin-bottom: 4px !important; /* 标题下边距 */
  white-space: nowrap; /* 标题不换行 */
  overflow: hidden; /* 超出部分隐藏 */
  text-overflow: ellipsis; /* 超出部分显示省略号 */
}
:deep(.ant-card-meta-description) {
  font-size: 12px; /* 描述字号 */
  color: rgba(0, 0, 0, 0.45); /* 描述颜色 */
}
:deep(.ant-tag) {
  margin: 2px; /* 标签外边距 */
  font-size: 10px; /* 标签字号 */
  padding: 0 4px; /* 标签内边距 */
  line-height: 16px; /* 标签行高 */
}
:deep(.ant-card-actions) {
  padding: 8px 0; /* 操作栏内边距 */
  font-size: 14px; /* 操作图标大小 */
}
:deep(.ant-card-actions > li) {
  margin: 4px 0; /* 操作项垂直间距 */
}
</style>
