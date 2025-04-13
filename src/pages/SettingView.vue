<template>
  <div id="SettingView">
    <div class="setting-container">
      <div class="main-content">
        <div class="content-layout">
          <!-- 上方区域：用户信息 -->
          <div class="up-section">
            <!-- 用户信息区域 -->
            <div class="user-info-container">
              <div class="avatar-and-text">
                <div class="avatar-container">
                  <a-avatar
                    class="user-avatar"
                    :src="
                      loginUserStore.loginUser.userAvatar ||
                      getDefaultAvatar(loginUserStore.loginUser.userName)
                    "
                    :size="80"
                  />
                </div>
                <div class="text-info-container">
                  <div class="user-name">{{ loginUserStore.loginUser.userName }}</div>
                  <div class="user-id">ID: {{ loginUserStore.loginUser.id }}</div>
                </div>
              </div>
            </div>

            <!-- 下方区域：操作按钮 -->
            <div class="down-section">
              <!-- 操作按钮区域 -->
              <div class="button-container">
                <a-button class="custom-button" @click="openModal">
                  <span class="button-content">
                    <EditOutlined class="button-icon edit-icon" />
                    <span class="button-text">编辑资料</span>
                  </span>
                  <RightOutlined class="arrow-icon" />
                </a-button>

                <a-button class="custom-button" @click="modifyPasswordopenModal">
                  <span class="button-content">
                    <LockOutlined class="button-icon password-icon" />
                    <span class="button-text">修改密码</span>
                  </span>
                  <RightOutlined class="arrow-icon" />
                </a-button>

                <a-button class="custom-button" @click="changeEmailOpenModal">
                  <span class="button-content">
                    <MailOutlined class="button-icon email-icon" />
                    <span class="button-text">修改邮箱</span>
                  </span>
                  <RightOutlined class="arrow-icon" />
                </a-button>

                <a-button class="custom-button" @click="aboutUsopenModal">
                  <span class="button-content">
                    <InfoCircleOutlined class="button-icon about-icon" />
                    <span class="button-text">关于云库</span>
                  </span>
                  <RightOutlined class="arrow-icon" />
                </a-button>

                <a-button class="custom-button" @click="openExchangeVipModal">
                  <span class="button-content">
                    <GiftOutlined class="button-icon exchangevip-icon" />
                    <span class="button-text">兑换会员</span>
                  </span>
                  <RightOutlined class="arrow-icon" />
                </a-button>

                <a-button class="custom-button" @click="showLogoutConfirm">
                  <span class="button-content">
                    <LogoutOutlined class="button-icon destroy-icon" />
                    <span class="button-text">注销账号</span>
                  </span>
                  <RightOutlined class="arrow-icon" />
                </a-button>
              </div>

              <!-- PC端卡通插画区域 -->
              <div class="illustration-container">
                <div class="illustration-content">
                  <div ref="animationContainer" class="animation-container"></div>
                  <p class="illustration-text">「云端共绘无界，灵感秒传有方」( •̀ ω •́ )✧</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 编辑资料模态框 -->
          <a-modal v-model:open="open" title="编辑资料">
            <div class="avatar-upload-container">
              <div class="avatar-wrapper">
                <a-avatar
                  :src="myMessage.userAvatar || getDefaultAvatar(myMessage.userName)"
                  :size="80"
                />
                <div class="upload-icon" @click="showFileUploadDialog">
                  <PlusOutlined />
                </div>
              </div>
              <input
                type="file"
                ref="fileInput"
                style="display: none"
                accept="image/*"
                @change="handleAvatarUpload"
              />
            </div>

            <!-- 头像裁剪组件 -->
            <AvatarCropper
              ref="avatarCropperRef"
              :imageUrl="tempImageUrl"
              @success="handleCroppedAvatar"
            />

            <div class="form-container">
              <a-form layout="vertical">
                <a-form-item label="昵称">
                  <a-input v-model:value="myMessage.userName" />
                </a-form-item>
                <a-form-item label="简介">
                  <a-input v-model:value="myMessage.userProfile" />
                </a-form-item>
                <a-form-item label="编号">
                  <a-input v-model:value="myMessage.id" disabled />
                </a-form-item>
                <a-form-item label="邮箱">
                  <a-input v-model:value="myMessage.email" disabled />
                </a-form-item>
                <a-form-item label="账号">
                  <a-input v-model:value="myMessage.userAccount" disabled />
                </a-form-item>
                <a-form-item label="角色">
                  <a-input v-model:value="roleText" disabled />
                </a-form-item>
              </a-form>
            </div>

            <template #footer>
              <div style="text-align: center">
                <a-button @click="editProfile" class="submit-button">完成</a-button>
              </div>
            </template>
          </a-modal>

          <!-- 修改密码模态框 -->
          <a-modal v-model:open="modifyPasswordOpen" title="修改密码" class="password-modal">
            <div class="password-form">
              <a-form layout="vertical">
                <a-form-item label="旧密码" required>
                  <a-input
                    v-model:value="modifyPasswordFormData.oldPassword"
                    type="password"
                    placeholder="请输入旧密码"
                  />
                </a-form-item>
                <a-form-item label="新密码" required>
                  <a-input
                    v-model:value="modifyPasswordFormData.newPassword"
                    type="password"
                    placeholder="请输入新密码"
                  />
                </a-form-item>
                <a-form-item label="确认新密码" required>
                  <a-input
                    v-model:value="modifyPasswordFormData.checkPassword"
                    type="password"
                    placeholder="请再次输入新密码"
                  />
                </a-form-item>
              </a-form>
            </div>
            <div class="forgot-password-link">
              忘记密码？
              <a @click="handleForgotPassword">点击这里重置</a>
            </div>
            <template #footer>
              <div style="text-align: center">
                <a-button @click="submitPasswordForm" class="submit-button">确认修改</a-button>
              </div>
            </template>
          </a-modal>

          <!-- 修改邮箱模态框 -->
          <a-modal v-model:open="changeEmailOpen" title="修改邮箱">
            <div class="form-container">
              <a-form layout="vertical">
                <a-form-item label="新邮箱">
                  <a-input v-model:value="changeEmailForm.newEmail" />
                </a-form-item>
                <a-form-item label="验证码">
                  <div class="verify-code-container">
                    <a-input
                      v-model:value="changeEmailForm.code"
                      placeholder="请输入验证码"
                      maxlength="6"
                    />
                    <a-button
                      class="send-code-btn"
                      :disabled="!!countdown || !changeEmailForm.newEmail"
                      @click="sendEmailCode"
                    >
                      {{ countdown ? `${countdown}s后重试` : '获取验证码' }}
                    </a-button>
                  </div>
                </a-form-item>
              </a-form>
            </div>
            <template #footer>
              <div style="text-align: center">
                <a-button @click="handleChangeEmail" class="submit-button">完成</a-button>
              </div>
            </template>
          </a-modal>

          <!-- 兑换会员码模态框 -->
          <a-modal v-model:open="exchangeVipOpen" title="兑换会员">
            <div class="form-container">
              <a-form layout="vertical">
                <a-form-item label="兑换码">
                  <a-input v-model:value="exchangeVipForm.vipCode" placeholder="请输入兑换码" />
                </a-form-item>
              </a-form>
            </div>
            <template #footer>
              <div style="text-align: center">
                <a-button @click="handleExchangeVip" class="submit-button">提交</a-button>
              </div>
            </template>
          </a-modal>

          <!-- 关于云库模态框 -->
          <a-modal v-model:open="aboutUsOpen" title="关于云库" :footer="null" class="about-modal">
            <div class="about-content">
              <h3 class="app-name">云图汇</h3>
              <p class="version">Version 2.0.0</p>
              <div class="divider"></div>
              <p class="description">
                &emsp;&emsp;云图汇是一个企业级智能协作云图库平台，提供图片的上传、管理、分享和分析功能。用户可以创建个人或团队空间，上传图片并进行分类、标签管理。支持以图搜图、AI扩图等智能功能，满足企业级用户对图片管理的多样化需求。
              </p>
              <p class="copyright">© {{ 2025 }} HinsCoder. All rights reserved.</p>
              <a href="https://beian.miit.gov.cn/" target="_blank" class="icp-link">
                备案号
              </a>
            </div>
          </a-modal>

          <!-- 注销确认模态框 -->
          <a-modal
            v-model:open="logoutConfirmOpen"
            :footer="null"
            :width="400"
            class="logout-modal"
            @cancel="logoutConfirmOpen"
          >
            <div class="logout-modal-content">
              <div class="warning-icon">
                <ExclamationCircleFilled />
              </div>
              <h3 class="modal-title">确认注销账号？</h3>
              <p class="modal-desc">注销后将无法恢复，您的所有数据将被清除。请谨慎操作！</p>
              <div class="modal-actions">
                <a-button class="cancel-button" @click="logoutConfirmOpen = false"> 取消 </a-button>
                <a-button class="confirm-button" @click="confirmLogout"> 确认注销 </a-button>
              </div>
            </div>
          </a-modal>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'
import { ref, onMounted, computed, reactive, onBeforeUnmount } from 'vue'
import {
  EditOutlined,
  LockOutlined,
  InfoCircleOutlined,
  LogoutOutlined,
  RightOutlined,
  PlusOutlined,
  ExclamationCircleFilled,
  MailOutlined,
  GiftOutlined,
} from '@ant-design/icons-vue'

import { Form, message } from 'ant-design-vue'
import {
  changePasswordUsingPost,
  updateUserUsingPost,
  userDestroyUsingPost,
  updateUserAvatarUsingPost,
  getEmailCodeUsingPost,
  changeEmailUsingPost,
  exchangeVipUsingPost
} from '@/api/userController.ts'
import router from '@/router'
import UserModifyPassWord = API.UserModifyPassWord

import VChart from 'vue-echarts'
import * as echarts from 'echarts'
import lottie from 'lottie-web'

import AvatarCropper from '@/components/AvatarCropper.vue'

const loginUserStore = useLoginUserStore()
const open = ref<boolean>(false)
const myMessage = ref({
  userName: loginUserStore.loginUser.userName,
  id: loginUserStore.loginUser.id,
  userAccount: loginUserStore.loginUser.userAccount,
  userProfile: loginUserStore.loginUser.userProfile,
  userRole: loginUserStore.loginUser.userRole,
  userAvatar: loginUserStore.loginUser.userAvatar,
  email: loginUserStore.loginUser.email,
})

// 页面加载时获取设备类型
onMounted(async () => {
  getFollowAndFansCount()
})
// 根据用户角色计算出对应的显示文本
const roleText = ref<string>(myMessage.value.userRole === 'admin' ? '管理员' : '普通用户')
const openModal = () => {
  open.value = true
}
const editProfile = async () => {
  const res = await updateUserUsingPost(myMessage.value)
  if (res.data.code === 0 && res.data.data) {
    // message.success('修改成功')
    // 获取useLoginUserStore实例
    const loginUserStore = useLoginUserStore()
    // 调用fetchLoginUser方法重新获取用户信息以更新仓库数据
    await loginUserStore.fetchLoginUser()
  } else {
    message.error('修改失败，' + res.data.message)
  }
  open.value = false
}

const modifyPasswordOpen = ref<boolean>(false)
const modifyPasswordopenModal = () => {
  modifyPasswordOpen.value = true
}

// 用于存储表单数据的响应式对象
const modifyPasswordFormData = ref({
  oldPassword: '',
  newPassword: '',
  checkPassword: '',
})

// 获取表单实例的引用
const modifyPasswordForm = ref<Form | null>(null)

const submitPasswordForm = async () => {
  try {
    const userModifyPassword: UserModifyPassWord = {
      id: loginUserStore.loginUser.id,
      oldPassword: modifyPasswordFormData.value.oldPassword,
      newPassword: modifyPasswordFormData.value.newPassword,
      checkPassword: modifyPasswordFormData.value.checkPassword,
    }
    // console.log(userModifyPassword)
    const res = await changePasswordUsingPost(userModifyPassword)
    if (res.data.code === 0) {
      // message.success('修改成功')
      modifyPasswordOpen.value = false
    } else {
      message.error('修改失败，' + res.data.message)
    }
  } catch (error) {
    // console.log(error)
  }
}

const aboutUsOpen = ref<boolean>(false)
const aboutUsopenModal = () => {
  aboutUsOpen.value = true
}

// 控制确认注销模态框的显示与隐藏
const logoutConfirmOpen = ref<boolean>(false)
// 显示确认注销模态框的方法
const showLogoutConfirm = () => {
  logoutConfirmOpen.value = true
}
// 确认注销的方法，在模态框点击确定按钮后执行真正的注销逻辑
const confirmLogout = async () => {
  const id = loginUserStore.loginUser.id
  const res = await userDestroyUsingPost({ id })
  if (res.data.code === 0) {
    message.success('注销成功')
    // 退出登录，清除登录态
    loginUserStore.logout()
    // 重定向到登录页面
    router.push({
      path: '/user/login',
      replace: true,
    })
  } else {
    message.error('注销失败，' + res.data.message)
  }
  logoutConfirmOpen.value = false
}

// 修改文件输入框的引用名称
const fileInput = ref<HTMLInputElement | null>(null)

// 修改显示文件选择对话框的方法
const showFileUploadDialog = () => {
  // 确保DOM元素已经挂载
  if (fileInput.value) {
    fileInput.value.click()
  } else {
    console.error('文件输入框未找到')
  }
}

// 图片裁剪组件引用
const avatarCropperRef = ref()
// 临时图片 URL
const tempImageUrl = ref('')

// 修改头像上传处理方法
const handleAvatarUpload = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) {
    // 创建临时 URL 并打开裁剪器
    tempImageUrl.value = URL.createObjectURL(file)
    if (avatarCropperRef.value) {
      avatarCropperRef.value.openModal()
    }
    // 清空 input 值，允许重复选择同一文件
    ;(e.target as HTMLInputElement).value = ''
  }
}

// 处理裁剪后的头像
const handleCroppedAvatar = async (file: File) => {
  try {
    const params = {
      id: loginUserStore.loginUser.id,
    }
    const res = await updateUserAvatarUsingPost(params, {}, file, {})
    if (res.data.code === 0) {
      message.success('头像上传成功')
      // 更新头像显示
      myMessage.value.userAvatar = res.data.data
      // 更新全局用户信息
      await loginUserStore.fetchLoginUser()
      // 上传成功后关闭裁剪框
      if (avatarCropperRef.value) {
        avatarCropperRef.value.closeModal()
      }
    }
  } catch (error) {
    console.error('头像上传失败:', error)
    message.error('头像上传失败')
  }
}

// 添加新的响应式变量
const selectedYear = ref(new Date().getFullYear())
const signInData = ref<number[]>([])

// 生成年份选项
const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 3 }, (_, i) => ({
    label: `${currentYear - i}年`,
    value: currentYear - i,
  }))
})

// 获取默认头像
const getDefaultAvatar = (userName: string) => {
  const defaultName = userName || 'Guest'
  return `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${encodeURIComponent(defaultName)}
  &backgroundColor=059ff2,71cf62,f6d594,b6e3f4,c0aede,ffd5dc,d1d4f9,ffdfbf&backgroundType=solid,gradientLinear`
}

const animationContainer = ref<HTMLElement | null>(null)

// 初始化 Lottie 动画
onMounted(() => {
  if (animationContainer.value) {
    lottie.loadAnimation({
      container: animationContainer.value,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: 'https://lottie.host/73424be4-23f0-424d-9450-6cd8d45e45e0/03MGaObi3X.json',
    })
  }
})

// 兑换会员相关
// 控制模态框显示
const exchangeVipOpen = ref(false)
const exchangeVipForm = reactive({
  vipCode: '',
})

// 打开兑换会员模态框
const openExchangeVipModal = () => {
  exchangeVipOpen.value = true
  exchangeVipForm.vipCode = ''
}

// 处理兑换会员
const handleExchangeVip = async () => {
  if (!exchangeVipForm.vipCode) {
    message.error('请输入兑换码')
    return
  }

  try {
    const res = await exchangeVipUsingPost({
      vipCode: exchangeVipForm.vipCode,
    })
    if (res.data.code === 0 && res.data.data) {
      message.success('兑换成功！请刷新页面')
      exchangeVipOpen.value = false
      router.push({ path: '/' })
    } else {
      message.error('兑换失败：' + res.data.message)
    }
  } catch (error) {
    message.error('兑换失败，请稍后重试')
  }
}

// 修改邮箱相关
const changeEmailOpen = ref(false)
const changeEmailForm = reactive({
  newEmail: '',
  code: '',
})
const countdown = ref<number>(0)
let timer: NodeJS.Timeout | null = null

// 打开修改邮箱模态框
const changeEmailOpenModal = () => {
  changeEmailOpen.value = true
  changeEmailForm.newEmail = ''
  changeEmailForm.code = ''
}

// 发送邮箱验证码
const sendEmailCode = async () => {
  try {
    const res = await getEmailCodeUsingPost({
      email: changeEmailForm.newEmail,
      type: 'changeEmail',
    })
    if (res.data.code === 0) {
      message.success('验证码已发送')
      countdown.value = 60
      timer = setInterval(() => {
        countdown.value--
        if (countdown.value <= 0) {
          clearInterval(timer!)
          timer = null
        }
      }, 1000)
    } else {
      message.error(res.data.message || '发送失败')
    }
  } catch (error: any) {
    message.error(error.response?.data?.message || '验证码发送失败')
  }
}

// 处理修改邮箱
const handleChangeEmail = async () => {
  try {
    const res = await changeEmailUsingPost(changeEmailForm)
    if (res.data.code === 0) {
      message.success('邮箱修改成功')
      changeEmailOpen.value = false
    } else {
      message.error(res.data.message || '修改失败')
    }
  } catch (error: any) {
    message.error(error.response?.data?.message || '修改失败')
  }
}

// 处理忘记密码
const handleForgotPassword = () => {
  modifyPasswordOpen.value = false
  router.push('/user/reset-password')
}

// 组件卸载时清理定时器
onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})
</script>

<style scoped>
#SettingView {
  min-height: calc(100vh - 120px);
  position: relative;
  overflow: hidden;
  width: 100%;
  display: flex;
  justify-content: center;
}

/* 设置界面容器 */
.setting-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px 20px;
  height: 100%;
  position: relative;
}

.main-content {
  position: relative;
  z-index: 1;
  width: 100%;
}

/* 左右布局容器 */
.content-layout {
  display: flex;
  gap: 20px;
  padding-top: 24px;
  width: 100%;
  height: 100%;
}

/* 上方区域 */
.up-section {
  flex: 1;
  min-width: 800px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 下方区域 */
.down-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex-shrink: 0;
}

/* 用户信息区域 */
.user-info-container {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  height: 112px;
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, rgba(83, 142, 255, 0.05) 0%, rgba(107, 107, 255, 0.05) 100%);
}

.avatar-and-text {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-avatar {
  border-radius: 16px;
  border: 2px solid white;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  background-color: #fff6f3;
}

.text-info-container {
  flex: 1;
}

.user-name {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.user-id {
  font-size: 13px;
  color: #94a3b8;
}

/* 按钮容器 */
.button-container {
  background: #F8F8F8; /* 更柔和的浅灰色背景 */
  border-radius: 16px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  height: 340px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  background: linear-gradient(135deg, rgba(201, 173, 167, 0.05) 0%, rgba(190, 180, 166, 0.05) 100%); /* 莫兰迪粉棕色渐变 */
}

.custom-button {
  margin-bottom: 8px;
}

/* 按钮样式 */
:deep(.custom-button) {
  width: 100%;
  height: 52px;
  padding: 0 16px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 12px;
  margin-bottom: 8px !important;
  transition: all 0.3s ease;
}

/* 莫兰迪色系按钮背景色 (淡化) */
:deep(.custom-button:has(.edit-icon)) {
  background: rgba(119, 141, 169, 0.05); /* 灰蓝色 */
}

:deep(.custom-button:has(.password-icon)) {
  background: rgba(163, 177, 138, 0.05); /* 灰绿色 */
}

:deep(.custom-button:has(.email-icon)) {
  background: rgba(226, 220, 200, 0.05); /* 浅米色 */
}

:deep(.custom-button:has(.about-icon)) {
  background: rgba(201, 173, 167, 0.05); /* 灰粉色 */
}

:deep(.custom-button:has(.destroy-icon)) {
  background: rgba(156, 180, 204, 0.05); /* 灰青色 */
}

:deep(.custom-button:has(.exchangevip-icon)) {
  background: rgba(190, 180, 166, 0.05); /* 灰棕色 */
}

/* 莫兰迪色系按钮悬停效果 (略微加深) */
:deep(.custom-button:has(.edit-icon):hover) {
  background: rgba(119, 141, 169, 0.1); /* 灰蓝色 */
}

:deep(.custom-button:has(.password-icon):hover) {
  background: rgba(163, 177, 138, 0.1); /* 灰绿色 */
}

:deep(.custom-button:has(.email-icon):hover) {
  background: rgba(226, 220, 200, 0.1); /* 浅米色 */
}

:deep(.custom-button:has(.about-icon):hover) {
  background: rgba(201, 173, 167, 0.1); /* 灰粉色 */
}

:deep(.custom-button:has(.destroy-icon):hover) {
  background: rgba(156, 180, 204, 0.1); /* 灰青色 */
}

:deep(.custom-button:has(.exchangevip-icon):hover) {
  background: rgba(190, 180, 166, 0.1); /* 灰棕色 */
}

.button-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 图标颜色 */
:deep(.edit-icon) {
  color: #0ea5e9;
}
:deep(.password-icon) {
  color: #8b5cf6;
}

:deep(.email-icon) {
  color: #0ea5e9;
}
:deep(.about-icon) {
  color: #4eb217;
}
:deep(.destroy-icon) {
  color: #ef4444;
}
:deep(.exchangevip-icon) {
  color: #ffb44a;
}

:deep(.button-text) {
  font-size: 15px;
  color: #1a1a1a;
}

:deep(.arrow-icon) {
  color: #94a3b8;
  font-size: 14px;
}

/* 模态框样式优化 */
:deep(.ant-modal) {
  border-radius: 20px;
  overflow: hidden;
}

:deep(.ant-modal-content) {
  padding: 24px;
}

:deep(.ant-modal-header) {
  border-bottom: none;
  padding: 0 0 20px 0;
}

:deep(.ant-modal-title) {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

:deep(.ant-modal-body) {
  padding: 0;
}

/* 头像上传区域优化 */
.avatar-upload-container {
  position: relative;
  text-align: center;
  padding: 32px 0;
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-wrapper {
  position: relative;
  display: inline-block;
  padding: 4px;
  background: white;
  border-radius: 50%;
  cursor: pointer;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  background: linear-gradient(135deg, rgba(83, 142, 255, 0.1) 0%, rgba(107, 107, 255, 0.1) 100%);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(107, 107, 255, 0.15)
  }

  &:active {
    transform: translateY(0);
  }
}

:deep(.ant-avatar) {
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  width: 80px !important;
  height: 80px !important;
  background-color: #fff6f3;

  &:hover {
    border-color: #53a2ff;
  }
}

.upload-icon {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #53a2ff 0%, #6b6bff 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(107, 107, 255, 0.3);
  z-index: 2;
  border: 2px solid white;
}

/* 确保上传图标可以被点击 */
.upload-icon:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(107, 107, 255, 0.4);
}

/* 响应式调整 */
@media screen and (max-width: 768px) {
  .avatar-upload-container {
    padding: 24px 0;
    margin-bottom: 20px;
    width: 100%;
  }

  .avatar-wrapper {
    padding: 3px;
    margin: 0 auto;
  }

  :deep(.ant-avatar) {
    width: 72px !important;
    height: 72px !important;
  }

  .upload-icon {
    width: 24px;
    height: 24px;
    bottom: -3px;
    right: -3px;
  }
}

/* 添加加载状态的样式 */
.uploading {
  opacity: 0.7;
  pointer-events: none;
}

/* 模态框通用样式 */
:deep(.modal-footer) {
  text-align: center;
  padding-top: 24px;
}

/* 提交按钮样式 */
:deep(.submit-button) {
  background: linear-gradient(135deg, #53a2ff 0%, #6b6bff 100%);
  border: none;
  color: white;
  width: 200px;
  height: 44px;
  border-radius: 22px;
  font-size: 15px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(107, 107, 255, 0.2);
  transition: all 0.3s ease;
}

:deep(.submit-button:hover) {
  color: #dedede;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(107, 107, 255, 0.3);
}

:deep(.submit-button:active) {
  transform: translateY(1px);
}

/* 表单样式优化 */
.form-container {
  padding: 0;
}

:deep(.ant-form-item) {
  margin-bottom: 20px;
}

:deep(.ant-form-item-label) {
  padding-bottom: 4px;
}

:deep(.ant-form-item-label > label) {
  font-size: 14px;
  color: #64748b;
}

:deep(.ant-input) {
  border-radius: 10px;
  border-color: #e2e8f0;
  padding: 8px 12px;
  transition: all 0.3s ease;
}

:deep(.ant-input:hover) {
  border-color: #53a2ff;
}

:deep(.ant-input:focus) {
  border-color: #53a2ff;
  box-shadow: 0 0 0 2px rgba(107, 107, 255, 0.1);
}

:deep(.ant-input[disabled]) {
  background: #f8fafc;
  color: #94a3b8;
  border-color: #e2e8f0;
}

/* 修改密码表单样式 */
.form-item-wrapper {
  margin-bottom: 16px;
}

.form-label {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 4px;
  display: block;
}

:deep(.form-input) {
  border-radius: 10px;
  border-color: #e2e8f0;
}

/* 模态框按钮样式 */
:deep(.ant-modal-footer) {
  text-align: center;
  border-top: none;
  padding: 24px 0 0 0;
}

:deep(.ant-modal-footer .ant-btn-primary) {
  background: linear-gradient(135deg, #53a9ff 0%, #6b6bff 100%);
  border: none;
  width: 200px;
  height: 44px;
  border-radius: 22px;
  font-size: 15px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(107, 107, 255, 0.2);
  transition: all 0.3s ease;
}


:deep(.ant-modal-footer .ant-btn-primary:hover) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(107, 107, 255, 0.3);
}

:deep(.ant-modal-footer .ant-btn-primary:active) {
  transform: translateY(1px);
}

/* 关于我们模态框样式 */
:deep(.ant-modal.about-modal .ant-modal-body) {
  text-align: center;
  padding: 32px 0;
}

:deep(.ant-modal.about-modal p) {
  font-size: 15px;
  color: #1a1a1a;
  margin-bottom: 8px;
}

:deep(.ant-modal.about-modal a) {
  color: #94a3b8;
  text-decoration: none;
  font-size: 13px;
  transition: color 0.3s ease;
}

:deep(.ant-modal.about-modal a:hover) {
  color: #53a2ff;
}

/* 确认注销模态框样式 */
:deep(.ant-modal.confirm-modal .ant-modal-body) {
  padding: 32px 24px;
  text-align: center;
  font-size: 15px;
  color: #1a1a1a;
}

/* 响应式调整 */
@media screen and (max-width: 768px) {
  .content-layout {
    flex-direction: column;
    padding-top: 12px;
    gap: 12px;
  }

  .up-section,
  .down-section {
    width: 100%;
    max-width: none;
    gap: 12px;
    min-width: unset;
  }

  #SettingView {
    padding: 12px 0;
    display: block;
    min-height: calc(100vh - 160px);
  }

  .setting-container {
    padding: 0;
  }

  .main-content {
    padding: 0 4px;
  }

  .user-info-container,
  .button-container {
    border-radius: 12px;
    margin: 0;
    box-shadow: none;
  }

  .user-info-container {
    margin-bottom: 12px;
  }
}

/* 修改密码模态框样式 */
.password-form {
  padding: 0 12px;
}

:deep(.password-modal .ant-form-item-label > label) {
  font-size: 14px;
  color: #64748b;
}

:deep(.password-modal .ant-form-item-label > label.ant-form-item-required::before) {
  color: #53a2ff;
}

:deep(.password-modal .ant-input) {
  height: 42px;
  border-radius: 10px;
  border-color: #e2e8f0;
  transition: all 0.3s ease;
}

:deep(.password-modal .ant-input:hover) {
  border-color: #53a2ff;
}

:deep(.password-modal .ant-input:focus) {
  border-color: #53a2ff;
  box-shadow: 0 0 0 2px rgba(255, 142, 83, 0.1);
}

/* 关于云库模态框样式 */
.about-content {
  padding: 32px 0;
  text-align: center;
}

.app-name {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 8px;
}

.version {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 20px;
}

.divider {
  width: 40px;
  height: 2px;
  background: linear-gradient(90deg, #53a9ff, #6b6bff);
  margin: 20px auto;
  border-radius: 1px;
}

.description {
  font-size: 15px;
  color: #333;
  line-height: 1.6;
  margin-bottom: 20px;
  text-align: justify;
}

.copyright {
  font-size: 14px;
  color: #1a1a1a;
  margin-bottom: 8px;
}

.icp-link {
  font-size: 13px;
  color: #94a3b8;
  text-decoration: none;
  transition: color 0.3s ease;
  display: inline-block;
  padding: 4px 8px;
  border-radius: 6px;
}

.icp-link:hover {
  color: #53a9ff;
}

/* 响应式调整 */
@media screen and (max-width: 768px) {
  .password-form {
    padding: 0 8px;
  }

  .about-content {
    padding: 20px 0;
  }

  .app-name {
    font-size: 18px;
  }
}

/* 注销模态框样式 */
:deep(.logout-modal) {
  .ant-modal-content {
    padding: 0;
    border-radius: 16px;
    overflow: hidden;
  }

  .ant-modal-close {
    color: #94a3b8;
    transition: all 0.3s ease;

    &:hover {
      color: #64748b;
      background: rgba(0, 0, 0, 0.02);
    }
  }

  .ant-modal-body {
    padding: 0;
  }
}

.logout-modal-content {
  padding: 32px 24px;
  text-align: center;
}

.warning-icon {
  font-size: 48px;
  color: #ff4d4f;
  margin-bottom: 16px;

  .anticon {
    animation: pulse 2s infinite;
  }
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 12px;
}

.modal-desc {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 24px;
  line-height: 1.6;
  padding: 0 16px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.cancel-button {
  min-width: 100px;
  height: 38px;
  border-radius: 19px;
  border: 1px solid #e2e8f0;
  color: #64748b;
  font-size: 14px;
  transition: all 0.3s ease;

  &:hover {
    color: #1a1a1a;
    border-color: #94a3b8;
    background: #f8fafc;
  }
}

.confirm-button {
  min-width: 100px;
  height: 38px;
  border-radius: 19px;
  background: #ff4d4f;
  border: none;
  color: white;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;

  &:hover {
    color: #e88f8f;
    background: #ff4d4f;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(107, 107, 255, 0.2);
  }

  &:active {
    transform: translateY(1px);
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 响应式调整 */
@media screen and (max-width: 768px) {
  .logout-modal-content {
    padding: 24px 16px;
  }

  .warning-icon {
    font-size: 40px;
  }

  .modal-title {
    font-size: 16px;
  }

  .modal-desc {
    font-size: 13px;
    padding: 0 8px;
  }

  .modal-actions {
    gap: 8px;
  }

  .cancel-button,
  .confirm-button {
    min-width: 90px;
    height: 36px;
    font-size: 13px;
  }
}

/* 下拉选择器样式 */
:deep(.ant-select-selector) {
  border-radius: 8px !important;
  border-color: #e2e8f0 !important;
  height: 32px !important;
  line-height: 32px !important;
}

:deep(.ant-select-selection-item) {
  line-height: 30px !important;
  font-size: 13px;
  color: #64748b;
}

/* 插画容器样式 */
.illustration-container {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  height: calc(100% - 256px);
  text-align: center;
  display: none;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(14, 165, 233, 0.05) 100%);
}

.illustration-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.animation-container {
  width: 260px;
  height: 260px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.illustration-text {
  font-size: 14px;
  color: #64748b;
  margin: 0;
  margin-top: 8px;
}

/* 仅在PC端显示插画 */
@media screen and (min-width: 769px) {
  .illustration-container {
    display: block;
  }

  .button-container {
    flex: 0 0 auto;
  }
}

/* 移动端隐藏插画 */
@media screen and (max-width: 768px) {
  .illustration-container {
    display: none;
  }
}

.user-stats {
  display: flex;
  align-items: center;
  margin-top: 4px;
  gap: 8px;
  font-size: 13px;
  color: #64748b;
}

.forgot-password-link {
  text-align: center;
  margin-top: -12px;
  margin-bottom: 16px;
  font-size: 14px;
  color: #64748b;
}

.forgot-password-link a {
  color: #53a9ff;
  margin-left: 4px;
  cursor: pointer;
  transition: color 0.3s ease;
}

.forgot-password-link a:hover {
  color: #3d7aff;
}

.verify-code-container {
  display: flex;
  gap: 12px;
}

.verify-code-container .ant-input {
  flex: 1;
}

.send-code-btn {
  min-width: 120px;
  height: 32px;
  border-radius: 6px;
  background: linear-gradient(135deg, #53a9ff 0%, #6b6bff 100%);
  border: none;
  color: white;
  font-size: 14px;
  transition: all 0.3s ease;
}

.send-code-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(107, 107, 255, 0.2);
}

.send-code-btn:disabled {
  background: #e2e8f0;
  color: #94a3b8;
  cursor: not-allowed;
}


</style>
