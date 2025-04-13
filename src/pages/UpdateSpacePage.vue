<template>
  <div id="editSpacePage">
    <h2 style="margin-bottom: 16px">{{ pageTitle }}</h2>
    <!-- 空间信息表单 -->
    <a-form v-if="space" name="spaceForm" layout="vertical" :model="spaceForm" @finish="handleSubmit">
      <a-form-item name="spaceName" label="空间名称" :rules="[{ required: true, message: '请输入空间名称' }]">
        <a-input v-model:value="spaceForm.spaceName" placeholder="请输入空间名称" allow-clear />
      </a-form-item>
      <a-form-item name="spaceLevel" label="空间级别" :rules="[{ required: true, message: '请选择空间级别' }]">
        <a-select
          v-model:value="spaceForm.spaceLevel"
          style="min-width: 180px"
          placeholder="请选择空间级别"
          :options="SPACE_LEVEL_OPTIONS"
          allow-clear
        />
      </a-form-item>
      <a-form-item>
        <a-button type="primary" html-type="submit" :loading="loading" style="width: 100%">
          提交修改
        </a-button>
      </a-form-item>
    </a-form>
    <a-alert v-else-if="!loading && !space" message="空间数据加载失败或不存在" type="error" />
    <a-spin v-else :spinning="loading" tip="加载中..." />

    <!-- 空间级别介绍 -->
    <a-card title="空间级别介绍" style="margin-top: 24px">
      <a-typography-paragraph>
        * 目前仅支持开通普通版和专业版，专业版要开通黄金会员，如需升级旗舰版空间，请联系
        <a href="https://github.com/HinsCoder" target="_blank">Hins</a>
      </a-typography-paragraph>
      <a-typography-paragraph v-for="spaceLevel in spaceLevelList" :key="spaceLevel.level">
        {{ spaceLevel.text }}：大小 {{ formatSize(spaceLevel.maxSize) }}，数量
        {{ spaceLevel.maxCount }} 张
      </a-typography-paragraph>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import {
  getSpaceVoByIdUsingGet,
  listSpaceLevelUsingGet,
  updateSpaceUsingPost,
} from '@/api/spaceController.ts'
import { useRoute, useRouter } from 'vue-router'
import { SPACE_LEVEL_OPTIONS, SPACE_TYPE_MAP } from '@/constants/space.ts'
import { formatSize } from '@/utils' // 确保路径正确
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts' // 确保路径正确

// --- State ---

const space = ref<API.SpaceVO>() // 存储原始空间信息
const spaceForm = reactive<API.SpaceEditRequest>({}) // 用于表单编辑
const loading = ref(false) // 页面加载或提交状态
const spaceLevelList = ref<API.SpaceLevel[]>([])
const pageTitle = ref('加载空间信息...') // 动态页面标题

const route = useRoute()
const router = useRouter()
const loginUserStore = useLoginUserStore()
const loginUser = loginUserStore.loginUser

// --- Lifecycle Hooks ---

onMounted(() => {
  fetchSpaceLevelList()
  loadSpaceData()
})

// --- Methods ---

/**
 * 获取空间级别列表
 */
const fetchSpaceLevelList = async () => {
  try {
    const res = await listSpaceLevelUsingGet()
    if (res.data.code === 0 && res.data.data) {
      spaceLevelList.value = res.data.data
    } else {
      message.error('获取空间级别失败，' + res.data.message)
    }
  } catch (error: any) {
    message.error('获取空间级别失败，' + error.message)
  }
}

/**
 * 加载要编辑的空间数据
 */
const loadSpaceData = async () => {
  const id = route.query?.id
  if (!id) {
    message.error('缺少空间ID参数')
    pageTitle.value = '更新空间 - 错误'
    router.push('/') // 跳转回首页或列表页
    return
  }

  loading.value = true
  try {
    const res = await getSpaceVoByIdUsingGet({ id })
    if (res.data.code === 0 && res.data.data) {
      const data = res.data.data
      space.value = data
      // 填充表单
      spaceForm.id = data.id // 确保 ID 存在于表单模型中
      spaceForm.spaceName = data.spaceName
      spaceForm.spaceLevel = data.spaceLevel
      // 更新页面标题
      pageTitle.value = `更新 ${SPACE_TYPE_MAP[data.spaceType ?? 1]}` // 使用获取到的空间类型
    } else {
      message.error('获取空间信息失败，' + res.data.message)
      pageTitle.value = '更新空间 - 加载失败'
    }
  } catch (error: any) {
    message.error('获取空间信息失败，' + error.message)
    pageTitle.value = '更新空间 - 加载错误'
  } finally {
    loading.value = false
  }
}

/**
 * 提交更新空间的表单
 * @param values 表单值 (Ant Design Form 自动传入)
 */
const handleSubmit = async (values: API.SpaceEditRequest) => {
  const spaceId = space.value?.id // 从加载的数据中获取ID
  if (!spaceId) {
    message.error('无法获取空间ID，无法提交')
    return
  }

  loading.value = true
  try {
    const res = await updateSpaceUsingPost({
      id: spaceId, // 明确传递 ID
      ...values, // 使用 Ant Design Form 验证后的值
    })

    // 操作成功
    if (res.data.code === 0) { // 更新接口通常只返回 code 和 message
      message.success('更新成功')
      // 跳转到空间详情页或首页
      if (loginUser && loginUser.userRole === 'admin') {
        router.push({ path: `/` }) // 管理员跳转首页
      } else {
        router.push({ path: `/space/${spaceId}` }) // 普通用户跳转回空间详情页
      }
    } else {
      message.error('更新失败，' + res.data.message)
    }
  } catch (error: any) {
    message.error('更新失败，' + error.message)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
#editSpacePage {
  max-width: 720px;
  margin: 0 auto;
}
</style>
