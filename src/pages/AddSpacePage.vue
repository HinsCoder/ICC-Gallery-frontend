<template>
  <div id="addSpacePage">
    <h2 style="margin-bottom: 16px">创建 {{ SPACE_TYPE_MAP[spaceType] }}</h2>
    <!-- 空间信息表单 -->
    <a-form name="spaceForm" layout="vertical" :model="spaceForm" @finish="handleSubmit">
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
          提交创建
        </a-button>
      </a-form-item>
    </a-form>
    <!-- 空间级别介绍 -->
    <a-card title="空间级别介绍">
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
import { computed, onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { addSpaceUsingPost, listSpaceLevelUsingGet } from '@/api/spaceController.ts'
import { useRoute, useRouter } from 'vue-router'
import { SPACE_LEVEL_OPTIONS, SPACE_TYPE_ENUM, SPACE_TYPE_MAP } from '@/constants/space.ts'
import { formatSize } from '@/utils'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'

// --- State ---

const spaceForm = reactive<API.SpaceAddRequest>({})
const loading = ref(false)
const spaceLevelList = ref<API.SpaceLevel[]>([])
const route = useRoute()
const router = useRouter()
const loginUserStore = useLoginUserStore()
const loginUser = loginUserStore.loginUser

// --- Computed ---

/**
 * 空间类别，从路由参数获取，默认为私有空间
 */
const spaceType = computed(() => {
  // 优先从路由参数获取，若无则默认为私有空间
  const typeFromQuery = route.query?.type
  return typeFromQuery ? Number(typeFromQuery) : SPACE_TYPE_ENUM.PRIVATE
})

// --- Lifecycle Hooks ---

onMounted(() => {
  fetchSpaceLevelList()
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
 * 提交创建空间的表单
 * @param values 表单值 (Ant Design Form 自动传入)
 */
const handleSubmit = async (values: API.SpaceAddRequest) => {
  loading.value = true
  let newSpaceId: number | undefined = undefined
  try {
    const res = await addSpaceUsingPost({
      ...values, // 使用 Ant Design Form 验证后的值
      spaceType: spaceType.value,
    })

    // 操作成功
    if (res.data.code === 0 && res.data.data) {
      message.success('创建成功')
      newSpaceId = res.data.data

      // 跳转到空间详情页或首页
      if (loginUser && loginUser.userRole === 'admin') {
        router.push({ path: `/` }) // 管理员跳转首页
      } else if (newSpaceId) {
        router.push({ path: `/space/${newSpaceId}` }) // 普通用户跳转到新空间详情页
      } else {
        router.push({ path: `/` }) // 兜底跳转首页
      }
    } else {
      message.error('创建失败，' + res.data.message)
    }
  } catch (error: any) {
    message.error('创建失败，' + error.message)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
#addSpacePage {
  max-width: 720px;
  margin: 0 auto;
}
</style>
