<template>
  <div id="userResetPasswordPage">
    <h2 class="title">重置密码</h2>
    <div class="desc">请输入您的注册邮箱</div>
    <a-form :model="formState" name="basic" autocomplete="off" @finish="handleSubmit">

      <!-- 邮箱输入 -->
      <a-form-item
        name="email"
        :rules="[
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '请输入正确的邮箱格式' }
          ]"
      >
        <a-input
          v-model:value="formState.email"
          placeholder="请输入邮箱"
          size="large"
          :prefix="h(MailOutlined)"
          class="custom-input"
        />
      </a-form-item>

      <!-- 邮箱验证码 -->
      <a-form-item
        name="code"
        :rules="[
            { required: true, message: '请输入验证码' },
            { len: 6, message: '验证码长度为 6 位' },
            { pattern: /^\d+$/, message: '验证码必须是数字' }
          ]"
      >
        <div class="verify-code-container">
          <a-input
            v-model:value="formState.code"
            placeholder="请输入邮箱验证码"
            size="large"
            :prefix="h(SafetyCertificateOutlined)"
            class="custom-input verify-input"
            maxlength="6"
          />
          <a-button
            class="send-code-btn"
            :disabled="!!countdown || !formState.email"
            @click="sendEmailCode"
            size="large"
          >
            {{ countdown ? `${countdown}s后重试` : '获取验证码' }}
          </a-button>
        </div>
      </a-form-item>

      <!-- 新密码输入 -->
      <a-form-item
        name="newPassword"
        :rules="[
            { required: true, message: '请输入新密码' },
            { min: 8, message: '密码长度不能小于 8 位' },
          ]"
      >
        <a-input-password
          v-model:value="formState.newPassword"
          placeholder="请输入新密码"
          size="large"
          :prefix="h(LockOutlined)"
          class="custom-input"
        />
      </a-form-item>

      <!-- 确认密码 -->
      <a-form-item
        name="checkPassword"
        :rules="[{ required: true, message: '请确认密码' }, { validator: validatePassword }]"
      >
        <a-input-password
          v-model:value="formState.checkPassword"
          placeholder="请确认密码"
          size="large"
          :prefix="h(CheckOutlined)"
          class="custom-input"
        />
      </a-form-item>

      <!-- 返回登录 -->
      <div class="login-link">
        记起密码了？
        <RouterLink to="/user/login" class="link-text">返回登录</RouterLink>
      </div>

      <!-- 提交按钮 -->
      <a-form-item>
        <a-button type="primary" html-type="submit" class="submit-button" size="large">
          重置密码
        </a-button>
      </a-form-item>
    </a-form>
  </div>
</template>
<script lang="ts" setup>
import { reactive, ref, h, onBeforeUnmount } from 'vue'
import { resetPasswordUsingPost, getEmailCodeUsingPost } from '@/api/userController'
import { message } from 'ant-design-vue'
import router from '@/router'
import {
  MailOutlined,
  LockOutlined,
  CheckOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons-vue'

// 用于接受表单输入的值
const formState = reactive<API.UserResetPasswordRequest>({
  email: '',
  newPassword: '',
  checkPassword: '',
  code: '',
})

// 倒计时
const countdown = ref<number>(0)
let timer: NodeJS.Timeout | null = null

// 发送邮箱验证码
const sendEmailCode = async () => {
  try {
    const res = await getEmailCodeUsingPost({
      email: formState.email,
      type: 'resetPassword'
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
    if (error.response?.data) {
      message.error(error.response.data.message || '发送失败')
    } else {
      message.error('网络错误，请稍后重试')
    }
  }
}

// 验证两次密码是否一致
const validatePassword = async (_rule: any, value: string) => {
  if (value !== formState.newPassword) {
    return Promise.reject('两次输入的密码不一致')
  }
  return Promise.resolve()
}

// 提交表单
const handleSubmit = async (values: any) => {
  try {
    const res = await resetPasswordUsingPost(values)
    if (res.data.code === 0) {
      message.success('密码重置成功')
      await router.push('/user/login')
    } else {
      message.error(res.data.message || '重置失败')
    }
  } catch (error: any) {
    if (error.response?.data) {
      message.error(error.response.data.message || '重置失败')
    } else {
      message.error('网络错误，请稍后重试')
    }
  }
}

// 组件卸载时清除定时器
onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})
</script>

<style scoped>
#userResetPasswordPage {
  max-width: 360px;
  margin: 0 auto;
}

.title {
  text-align: center;
  margin-bottom: 16px;
}

.desc {
  text-align: center;
  color: #bbb;
  margin-bottom: 16px;
}

.verify-code-container {
  display: flex;
  gap: 12px;
  align-items: center;

  .verify-input {
    flex: 1;
  }

  .code-image {
    width: 120px;
    height: 44px;
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.2s ease;
    background: #f8fafc;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(1px);
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      padding: 2px;
    }
  }
}

.login-link {
  text-align: center;
  margin-bottom: 24px;
  color: #64748b;
  font-size: 14px;
}

.submit-button {
  width: 100%;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #53a2ff 0%, #6b6bff 100%);
  border: none;
  font-size: 16px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(107, 107, 255, 0.2);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(107, 107, 255, 0.3);
  }

  &:active {
    transform: translateY(1px);
  }
}


.register-link {
  text-align: center;
  margin-bottom: 24px;
  color: #64748b;
  font-size: 14px;

  .divider {
    margin: 0 8px;
    color: #e2e8f0;
  }

  .link-text {
    color: #53a2ff;
    font-weight: 500;
    margin-left: 4px;
    transition: color 0.3s ease;

    &:hover {
      color: #3d8bff;
    }
  }
}

</style>
