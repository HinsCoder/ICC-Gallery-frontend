<template>
  <a-modal
    class="image-out-painting"
    v-model:visible="visible"
    title="AI 扩图"
    :footer="false"
    @cancel="closeModal"
  >
    <div style="position: relative;">
      <div style="position: absolute; top: -30px; right: 30px; z-index: 1;">
        剩余额度：{{ loginUserStore.loginUser.outPaintingQuota }}
      </div>
      <a-row gutter="16">
        <a-col span="12">
          <h4>原始图片</h4>
          <img :src="picture?.url" :alt="picture?.name" style="max-width: 100%" />
        </a-col>
        <a-col span="12">
          <h4>扩图结果</h4>
          <img
            v-if="resultImageUrl"
            :src="resultImageUrl"
            :alt="picture?.name"
            style="max-width: 100%"
          />
        </a-col>
      </a-row>
    </div>
    <div style="margin-bottom: 16px" />
    <a-flex justify="center" gap="16">
      <a-button type="primary" :loading="!!taskId" ghost @click="createTask">生成图片</a-button>
      <a-button v-if="resultImageUrl" type="primary" :loading="uploadLoading" @click="handleUpload">
        应用结果
      </a-button>
    </a-flex>
  </a-modal>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import {
  createPictureOutPaintingTaskUsingPost,
  getPictureOutPaintingTaskUsingGet,
  uploadPictureByUrlUsingPost,
} from '@/api/pictureController.ts'
import { message } from 'ant-design-vue'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts' // 引入 store

interface Props {
  picture?: API.PictureVO
  spaceId?: number
  onSuccess?: (newPicture: API.PictureVO) => void
}

const props = defineProps<Props>()

const resultImageUrl = ref<string>('')
const taskId = ref<string>()
const loginUserStore = useLoginUserStore() // 获取 store 实例
const isTaskCreating = ref(false); // 标志位,防止重复创建

const createTask = async () => {
  if (!props.picture?.id || isTaskCreating.value) {
    return;
  }
  isTaskCreating.value = true;

  try {
    const res = await createPictureOutPaintingTaskUsingPost({
      pictureId: props.picture.id,
      parameters: {
        xScale: 2,
        yScale: 2,
      },
    });

    if (res.data.code === 0 && res.data.data) {
      message.success('创建任务成功，请耐心等待，不要退出界面');
      taskId.value = res.data.data.output.taskId;
      startPolling();
    } else {
      message.error('图片任务失败，' + res.data.message);
    }
  } finally {
    isTaskCreating.value = false;
  }
};

let pollingTimer: NodeJS.Timeout = null

const startPolling = () => {
  if (!taskId.value) {
    return
  }

  pollingTimer = setInterval(async () => {
    try {
      const res = await getPictureOutPaintingTaskUsingGet({
        taskId: taskId.value,
      })
      if (res.data.code === 0 && res.data.data) {
        const taskResult = res.data.data.output
        if (taskResult.taskStatus === 'SUCCEEDED') {
          message.success('扩图任务执行成功')
          resultImageUrl.value = taskResult.outputImageUrl
          clearPolling()
          // 不需要手动更新额度了，因为 loginUserStore 是响应式的
        } else if (taskResult.taskStatus === 'FAILED') {
          message.error('扩图任务执行失败')
          clearPolling()
        }
      }
    } catch (error) {
      console.error('扩图任务轮询失败', error)
      message.error('扩图任务轮询失败，' + error.message)
      clearPolling()
    }
  }, 3000)
}

const clearPolling = () => {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
    taskId.value = null
  }
}

const uploadLoading = ref(false)

const handleUpload = async () => {
  uploadLoading.value = true
  try {
    const params: API.PictureUploadRequest = {
      fileUrl: resultImageUrl.value,
      spaceId: props.spaceId,
    }
    if (props.picture) {
      params.id = props.picture.id
    }
    const res = await uploadPictureByUrlUsingPost(params)
    if (res.data.code === 0 && res.data.data) {
      message.success('图片上传成功')
      props.onSuccess?.(res.data.data)
      closeModal()
    } else {
      message.error('图片上传失败，' + res.data.message)
    }
  } catch (error) {
    console.error('图片上传失败', error)
    message.error('图片上传失败，' + error.message)
  }
  uploadLoading.value = false
}

const visible = ref(false)

const openModal = () => {
  visible.value = true
}

const closeModal = () => {
  visible.value = false
}

defineExpose({
  openModal,
})
</script>

<style>
.image-out-painting {
  text-align: center;
}
</style>
