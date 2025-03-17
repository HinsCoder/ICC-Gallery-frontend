<template>
  <div id="userRegisterPage">
    <h2 class="title">智绘云库 - 用户注册</h2>
    <div class="desc">企业级智能协作云图库</div>
    <a-form
      :model="formState"
      name="basic"
      label-align="left"
      autocomplete="off"
      @finish="handleSubmit"
    >
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
      <a-form-item name="code" :rules="[{ required: true, message: '请输入验证码' }]">
        <div class="verify-code-container">
          <a-input
            v-model:value="formState.code"
            placeholder="请输入邮箱验证码"
            size="large"
            :prefix="h(SafetyCertificateOutlined)"
            class="custom-input verify-input"
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

      <!-- 密码输入 -->
      <a-form-item
        name="userPassword"
        :rules="[
            { required: true, message: '请输入密码' },
            { min: 8, message: '密码长度不能小于 8 位' },
          ]"
      >
        <a-input-password
          v-model:value="formState.userPassword"
          placeholder="请输入密码"
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

      <!-- 登录链接 -->
      <div class="login-link">
        已有账号？
        <RouterLink to="/user/login" class="link-text">立即登录</RouterLink>
      </div>

      <!-- 注册按钮 -->
      <a-form-item>
        <a-button type="primary" html-type="submit" class="submit-button" size="large">
          注册
        </a-button>
      </a-form-item>
    </a-form>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, h ,onBeforeUnmount} from 'vue'
import { userRegisterUsingPost, getEmailCodeUsingPost } from '@/api/userController.ts'
import { message } from 'ant-design-vue'
import router from '@/router'
import { MailOutlined, LockOutlined, CheckOutlined, SafetyCertificateOutlined } from '@ant-design/icons-vue'

// 用于接收表单输入的值
const formState = reactive<API.UserRegisterRequest>({
  email: '',
  userPassword: '',
  checkPassword: '',
  code: '',
})

// 倒计时
const countdown = ref<number>(0)
let timer: NodeJS.Timeout | null = null

// 发送邮箱验证码
const sendEmailCode = async () => {
  try {
    await getEmailCodeUsingPost({
      email: formState.email,
      type: 'register'
    })
    message.success('验证码已发送')
    countdown.value = 60
    timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer!)
        timer = null
      }
    }, 1000)
  } catch (error: any) {
    message.error('验证码发送失败：' + error.message)
  }
}

// 验证两次密码是否一致
const validatePassword = async (_rule: any, value: string) => {
  if (value !== formState.userPassword) {
    return Promise.reject('两次输入的密码不一致')
  }
  return Promise.resolve()
}

// 提交表单
const handleSubmit = async (values: any) => {
  const res = await userRegisterUsingPost(values)
  if (res.data.code === 0 && res.data.data) {
    message.success('注册成功')
    await router.push('/user/login')
  } else {
    message.error('注册失败，' + res.data.message)
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
#userRegisterPage {
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
}

.verify-input {
  flex: 1;
}

.send-code-btn {
  min-width: 120px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #53a2ff 0%, #6b6bff 100%);
  border: none;
  color: white;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(107, 107, 255, 0.2);
  }

  &:active:not(:disabled) {
    transform: translateY(1px);
  }

  &:disabled {
    background: #e2e8f0;
    color: #94a3b8;
    cursor: not-allowed;
  }
}

.login-link {
  text-align: center;
  margin-bottom: 24px;
  color: #64748b;
  font-size: 14px;

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

</style>
