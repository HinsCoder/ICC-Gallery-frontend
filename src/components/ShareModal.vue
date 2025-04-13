<template>
  <a-modal v-model:visible="visible" :title="title" :footer="false" @cancel="closeModal" class="share-modal" :width="360">
    <div class="share-title" v-if="title">
      <h3>{{ title }}</h3>
    </div>
    <div class="share-content">
      <!-- 图片预览区域 -->
      <div class="preview-section">
        <img
          :src="displayImageUrl"
          class="preview-image"
          alt="分享预览"
          @error="handleImageError"
        />
      </div>

      <div class="qrcode-section">
        <div class="qrcode-wrapper">
          <a-qrcode :value="link" :size="180" :color="'#60c3d5'" :bgColor="'#ffffff'" :style="{ padding: '8px', background: 'white', borderRadius: '12px' }" class="custom-qrcode" />
          <div class="qrcode-tip">
            <span>扫码查看详情</span>
          </div>
        </div>
      </div>

      <div class="link-box">
        <a-typography-link copyable class="link-text">
          {{ link }}
        </a-typography-link>
        <a-button type="primary" @click="copyLink" class="copy-button">
          复制链接
        </a-button>
      </div>
    </div>

  </a-modal>
</template>
<script lang="ts" setup>
import { ref, computed } from 'vue'
import { message } from 'ant-design-vue';

/**
 * 定义组件属性类型
 */
interface Props {
  title: string;
  link: string;
  imageUrl: string;
}

/**
 * 给组件指定初始值
 */
const props = withDefaults(defineProps<Props>(), {

  link: 'https://avatars.githubusercontent.com/u/99468376?v=4',
  imageUrl: '' // 默认图片链接
})

// 是否可见
const visible = ref(false)

// 打开弹窗
const openModal = () => {
  visible.value = true
}

// 关闭弹窗
const closeModal = () => {
  visible.value = false
}

// 复制链接（localhost或ssl生效）
const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(props.link);
    message.success('链接已复制到剪贴板');
  } catch (err) {
    message.error('复制失败，请手动复制');
  }
};

// 处理图片加载错误
const handleImageError = (e: Event) => {
  const img = e.target as HTMLImageElement;
  img.src = 'https://pic.imgdb.cn/item/65ced2939f345e8d03633db1.jpg?x-oss-process=style/small'; // 使用默认图片
};

// 计算实际显示的图片URL
const displayImageUrl = computed(() => {
  return props.imageUrl || 'https://pic.imgdb.cn/item/65ced2939f345e8d03633db1.jpg?x-oss-process=style/small'; // 使用默认图片
});

// 暴露函数给父组件
defineExpose({
  openModal,
})
</script>

<style scoped>
.share-modal {
  :deep(.ant-modal-content) {
    background: linear-gradient(135deg, #fff5f0 0%, #fff 100%);
    border-radius: 16px;
    overflow: hidden;
  }

  :deep(.ant-modal-header) {
    background: transparent;
    border-bottom: none;
    padding: 24px 24px 0;
  }

  :deep(.ant-modal-body) {
    padding: 24px;
    position: relative;
  }
}

/* 添加标题样式 */
.share-title {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;

  h3 {
    margin: 0;
    color: #1a1a1a;
    font-size: 16px;
    line-height: 1.5;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.share-content {
  position: relative;
  z-index: 2;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 图片预览区域 */
.preview-section {
  width: 100%;
  aspect-ratio: 16/9;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: #f8fafc;  /* 添加背景色 */
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.3s ease;  /* 添加过渡效果 */
}

/* 二维码区域 */
.qrcode-section {
  display: flex;
  justify-content: center;
  padding: 16px 0;
}

.qrcode-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.8);
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(96, 195, 213, 0.15);
  transition: all 0.3s ease;
}

.custom-qrcode {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(96, 195, 213, 0.1);
}

.qrcode-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #60c3d5;
  margin-top: 8px;
  font-weight: 500;
}

.link-box {
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(255, 255, 255, 0.8);
  padding: 12px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.link-text {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #666;
  font-size: 13px;
}

.copy-button {
  flex-shrink: 0;
  height: 28px;
  border-radius: 14px;
  background: linear-gradient(135deg, #53a2ff 0%, #6b6bff 100%);
  border: none;
  padding: 0 12px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 2px 6px rgba(107, 107, 255, 0.2);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(107, 107, 255, 0.3);
  }

  &:active {
    transform: translateY(1px);
  }
}

/* 响应式调整 */
@media screen and (max-width: 768px) {
  .share-modal {
    :deep(.ant-modal-content) {
      margin: 12px;
    }
  }
  .preview-section {
    aspect-ratio: 1/1;
    background: #f5f5f5;
  }

  .preview-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .qrcode-wrapper {
    padding: 16px;
  }

  .custom-qrcode {
    width: 150px !important;
    height: 150px !important;
    box-shadow: 0 2px 6px rgba(96, 195, 213, 0.08);
  }

  .share-section {
    padding: 16px;
  }

  .section-title {
    font-size: 14px;
    margin-bottom: 12px;
  }

  .qrcode-wrapper {
    padding: 16px;
  }

  .qrcode-tip {
    font-size: 13px;
  }
}
</style>
