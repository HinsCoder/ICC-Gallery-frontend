// src/components/MobileBottomNav.vue
<template>
  <div class="mobile-bottom-nav">
    <!-- 主页 -->
    <router-link to="/" class="nav-item" :class="{ active: isActive('/') }">
      <HomeOutlined />
      <span>主页</span>
    </router-link>

    <!-- 我的空间 -->
    <router-link to="/my_space" class="nav-item" :class="{ active: isActive('/my_space') }">
      <UserOutlined />
      <span>我的</span>
    </router-link>

    <!-- 创建图片 (中心按钮) -->
    <div class="nav-item-center" @click="goToCreatePicture">
      <div class="center-icon-wrapper">
        <PlusOutlined />
      </div>
    </div>

    <!-- 团队空间 或 创建团队 -->
    <router-link :to="teamSpaceTargetLink" class="nav-item" :class="{ active: isActive('/space/') || isActive('/add_space?type=1') }">
      <TeamOutlined />
      <span>团队</span>
    </router-link>

    <!-- 个人中心 -->
    <router-link to="/user/setting" class="nav-item" :class="{ active: isActive('/user/setting') }">
      <SettingOutlined />
      <span>设置</span>
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  HomeOutlined,
  UserOutlined,
  PlusOutlined,
  TeamOutlined,
  SettingOutlined,
} from '@ant-design/icons-vue';
import { useLoginUserStore } from '@/stores/useLoginUserStore';
import { listMyTeamSpaceUsingPost } from '@/api/spaceUserController';
import { SPACE_TYPE_ENUM } from '@/constants/space';
import { message } from 'ant-design-vue';

const router = useRouter();
const route = useRoute();
const loginUserStore = useLoginUserStore();

// --- 团队空间逻辑 (与 GlobalSider 类似) ---
const teamSpaceList = ref<API.SpaceUserVO[]>([]);

/**
 * 加载用户的团队空间列表
 */
const fetchTeamSpaceList = async () => {
  // 确保用户已登录
  if (!loginUserStore.loginUser?.id) {
    teamSpaceList.value = [];
    return;
  }
  try {
    const res = await listMyTeamSpaceUsingPost();
    if (res.data.code === 0 && res.data.data) {
      teamSpaceList.value = res.data.data;
    } else {
      // 不阻塞用户，仅记录错误
      console.error('加载我的团队空间失败:', res.data.message);
      // message.error('加载我的团队空间失败: ' + res.data.message);
      teamSpaceList.value = []; // 加载失败则清空
    }
  } catch (error: any) {
    console.error('加载我的团队空间异常:', error.message);
    teamSpaceList.value = []; // 异常也清空
  }
};

/**
 * 计算团队空间按钮的目标链接
 * 如果有团队空间，链接到第一个团队空间；否则链接到创建团队页面
 */
const teamSpaceTargetLink = computed(() => {
  if (teamSpaceList.value.length > 0 && teamSpaceList.value[0]?.spaceId) {
    // 链接到第一个团队空间详情页
    return `/space/${teamSpaceList.value[0].spaceId}`;
  } else {
    // 链接到创建团队页面
    return `/add_space?type=${SPACE_TYPE_ENUM.TEAM}`;
  }
});

// 监听登录状态变化，重新加载团队空间
watchEffect(() => {
  fetchTeamSpaceList();
});

// --- 导航和状态 ---

/**
 * 跳转到创建图片页面
 */
const goToCreatePicture = () => {
  // 这里可以根据需要传递 spaceId，或者让创建页面自己处理
  router.push('/add_picture');
};

/**
 * 检查指定路径是否为当前活动路径或其前缀
 * @param path - 要检查的路径
 */
const isActive = (path: string) => {
  if (path === '/') {
    return route.path === '/'; // 精确匹配主页
  }
  // 对于空间详情页，检查前缀
  if (path === '/space/') {
    return route.path.startsWith('/space/');
  }
  return route.path.startsWith(path);
};

</script>

<style scoped>
.mobile-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 56px; /* 底部导航栏高度 */
  background-color: #ffffff;
  box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.08);
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 0 10px;
  z-index: 1000; /* 确保在最上层 */
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: #888; /* 未选中颜色 */
  text-decoration: none;
  font-size: 10px; /* 文字大小 */
  padding: 4px 0;
  transition: color 0.2s;
}

.nav-item .anticon {
  font-size: 20px; /* 图标大小 */
  margin-bottom: 2px;
}

/* 选中状态 */
.nav-item.active {
  color: #1890ff; /* 选中颜色 */
}

/* 中心 "+" 按钮容器 */
.nav-item-center {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px; /* 中心按钮宽度 */
  height: 50px; /* 中心按钮高度 */
  margin-top: -20px; /* 向上突出 */
  border-radius: 50%;
  background: linear-gradient(135deg, #53a2ff 0%, #6b6bff 100%);
  box-shadow: 0 4px 10px rgba(107, 107, 255, 0.3);
  cursor: pointer;
  transition: transform 0.2s ease-out;
}
.nav-item-center:active {
  transform: scale(0.95);
}


/* 中心 "+" 图标 */
.center-icon-wrapper {
  color: white;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
