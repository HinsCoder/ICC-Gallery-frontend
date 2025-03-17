<template>
  <div id="globalHeader">
    <a-row :wrap="false">
      <a-col flex="200px">
        <RouterLink to="/">
          <div class="title-bar">
            <img class="logo" src="../assets/logo.png" alt="logo" />
            <div class="title">智绘云库</div>
          </div>
        </RouterLink>
      </a-col>
      <a-col flex="auto">
        <a-menu
          v-model:selectedKeys="current"
          mode="horizontal"
          :items="items"
          @click="doMenuClick"
        />
      </a-col>
      <!-- 用户信息展示栏 -->
      <a-col flex="120px">
        <div class="user-login-status">
          <div v-if="loginUserStore.loginUser.id">
            <a-dropdown>
              <ASpace>
                <a-avatar :src="loginUserStore.loginUser.userAvatar || getDefaultAvatar(loginUserStore.loginUser?.userName)"/>
                {{ loginUserStore.loginUser.userName ?? '无名' }}
              </ASpace>
              <template #overlay>
                <a-menu>
                  <a-menu-item key="setting">
                    <router-link to="/user/setting">
                      <SettingOutlined />
                      个人中心
                    </router-link>
                  </a-menu-item>
                  <a-menu-item>
                    <router-link to="/my_space">
                      <UserOutlined />
                      我的空间
                    </router-link>
                  </a-menu-item>
                  <a-menu-item v-if="loginUserStore.loginUser.userRole === 'user'" key="redeem">
                    <router-link to="/user_exchange_vip">
                      <GiftOutlined />
                      兑换会员
                    </router-link>
                  </a-menu-item>
                  <a-menu-item
                    v-if="loginUserStore.loginUser.userRole === 'vip'"
                    class="vip-menu-item"
                  >
                    <CrownOutlined :style="{ color: '#ffd700' }" />
                    <span class="vip-text"> 黄金会员</span>
                  </a-menu-item>
                  <a-menu-item @click="doLogout">
                    <LogoutOutlined />
                    退出登录
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </div>
          <div v-else>
            <a-button type="primary" href="/user/login" class="login-button">
                <span class="button-content">
                  <UserOutlined />
                  <span>登录</span>
                </span>
            </a-button>
          </div>
        </div>
      </a-col>
    </a-row>
  </div>
</template>
<script lang="ts" setup>
import { computed, h, onMounted, ref } from 'vue'
import {
  HomeOutlined,
  LogoutOutlined,
  UserOutlined,
  SettingOutlined,
  CrownOutlined,
  GiftOutlined,
} from '@ant-design/icons-vue'
import { type MenuProps, message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'
import { userLogoutUsingPost } from '@/api/userController.ts'

// 获取默认头像
const getDefaultAvatar = (userName: string) => {
  const defaultName = userName || 'Guest'
  return `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${encodeURIComponent(defaultName)}
  &backgroundColor=059ff2,71cf62,f6d594,b6e3f4,c0aede,ffd5dc,d1d4f9,ffdfbf&backgroundType=solid,gradientLinear`
}

const loginUserStore = useLoginUserStore()
loginUserStore.fetchLoginUser()

// 未经过滤的菜单项
const originItems = [
  {
    key: '/',
    icon: () => h(HomeOutlined),
    label: '主页',
    title: '主页',
  },
  {
    key: '/add_picture',
    label: '创建图片',
    title: '创建图片',
  },
  {
    key: '/admin/userManage',
    label: '用户管理',
    title: '用户管理',
  },
  {
    key: '/admin/pictureManage',
    label: '图片管理',
    title: '图片管理',
  },
  {
    key: '/admin/spaceManage',
    label: '空间管理',
    title: '空间管理',
  },
  {
    key: 'others',
    label: h('a', { href: 'https://github.com/HinsCoder', target: '_blank' }, '联系我们'),
    title: '联系我们',
  },
]

// 根据权限过滤菜单项
const filterMenus = (menus = [] as MenuProps['items']) => {
  return menus?.filter((menu) => {
    // 管理员才能看到 /admin 开头的菜单
    if (menu?.key?.startsWith('/admin')) {
      const loginUser = loginUserStore.loginUser
      if (!loginUser || loginUser.userRole !== 'admin') {
        return false
      }
    }
    return true
  })
}

// 展示在菜单的路由数组
const items = computed<MenuProps['items']>(() => filterMenus(originItems))

const router = useRouter()

// 当前选中菜单
const current = ref<string[]>([])
// 监听路由变化，更新当前选中菜单
router.afterEach((to, from, next) => {
  current.value = [to.path]
})

// 路由跳转事件
const doMenuClick = ({ key }: { key: string }) => {
  router.push({
    path: key,
  })
}

// 用户注销
const doLogout = async () => {
  const res = await userLogoutUsingPost()
  console.log(res)
  if (res.data.code === 0) {
    loginUserStore.setLoginUser({
      userName: '未登录',
    })
    message.success('退出登录成功')
    await router.push('/user/login')
  } else {
    message.error('退出登录失败，' + res.data.message)
  }
}

onMounted(async () => {
  await loginUserStore.fetchLoginUser()
})
</script>

<style scoped>
.title-bar {
  display: flex;
  align-items: center;
}

.title {
  color: black;
  font-size: 18px;
  margin-left: 16px;
}

.logo {
  height: 48px;
}

/* 登录按钮样式 */
.login-button {
  height: 36px;
  width: 90px;
  padding: 0 20px;
  border-radius: 18px;
  background: linear-gradient(135deg, #53a2ff 0%, #6b6bff 100%);
  border: none;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(107, 107, 255, 0.2);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 14px; /* 增加顶部间距 */

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(107, 107, 255, 0.3);
  }

  &:active {
    transform: translateY(1px);
  }

  .button-content {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  :deep(.anticon) {
    font-size: 15px;
  }
}


.vip-menu-item {
  background: linear-gradient(45deg, #fff3e0, #ffecb3);
}
.vip-text {
  color: #ffd700;
  font-weight: 600;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
}
</style>
