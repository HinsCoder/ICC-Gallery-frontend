<template>
  <div id="basicLayout">
    <a-layout style="min-height: 100vh">
      <!-- PC 端 Header -->
      <a-layout-header class="header" v-if="!isMobile">
        <GlobalHeader />
      </a-layout-header>

      <a-layout>
        <!-- PC 端 Sider -->
        <GlobalSider class="sider" v-if="!isMobile" />

        <!-- 内容区域，动态添加 padding-bottom -->
        <a-layout-content class="content" :class="{ 'content-mobile': isMobile }">
          <router-view />
        </a-layout-content>
      </a-layout>

      <!-- 页脚 -->
      <a-layout-footer class="footer">
        © {{ currentYear }} HinsCoder. All rights reserved.
        <a href="https://beian.miit.gov.cn/" target="_blank">
          粤ICP备2025402338号-1</a>
      </a-layout-footer>

      <!-- 移动端底部导航栏 -->
      <MobileBottomNav v-if="isMobile" />

    </a-layout>
    <!-- AI 助手保持不变 -->
    <AiAssistant />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useWindowSize } from '@vueuse/core'; // 引入 useWindowSize
import GlobalHeader from '@/components/GlobalHeader.vue';
import GlobalSider from "@/components/GlobalSider.vue";
import MobileBottomNav from '@/components/MobileBottomNav.vue'; // 引入移动端底部导航
import AiAssistant from '@/components/chatbot/AiAssistant.vue';

// --- 设备判断 ---
const { width } = useWindowSize();
// 判断是否为移动端（可以根据需要调整断点）
const isMobile = computed(() => width.value < 768);

// --- 页脚年份计算 ---
const currentYear = computed(() => new Date().getFullYear());

</script>

<style scoped>
#basicLayout .header {
  padding-inline: 20px;
  margin-bottom: 1px;
  color: unset;
  background: white;
  /* 移动端隐藏 header，所以不需要特定移动端样式 */
}

#basicLayout .sider {
  background: #fff;
  border-right: 0.5px solid #eee;
  padding-top: 20px;
  /* 移动端隐藏 sider */
}

#basicLayout :deep(.ant-menu-root) {
  border-bottom: none !important;
  border-inline-end: none !important;
}

#basicLayout .content {
  background: linear-gradient(to right, #fefefe, #fff);
  padding: 20px;
  /* 默认最小高度，防止页脚上浮 */
  min-height: calc(100vh - 64px - 53px); /* PC: 100vh - header - footer */
  transition: padding-bottom 0.3s ease; /* 平滑过渡 padding */
}

/* 移动端内容区域样式 */
#basicLayout .content-mobile {
  padding: 12px; /* 移动端内边距可以小一点 */
  /* 增加底部内边距，防止内容被底部导航栏遮挡 */
  padding-bottom: 72px; /* 比底部导航栏高度 (56px) 稍大 */
  /* 移动端最小高度计算要减去底部导航栏高度 */
  min-height: calc(100vh - 56px - 53px); /* Mobile: 100vh - bottomNav - footer */
}


#basicLayout .footer {
  background: #efefef;
  padding: 16px;
  /* 移除 fixed 定位 */
  text-align: center;
  font-size: 13px;
}

#basicLayout .footer a {
  color: #666;
  text-decoration: none;
  position: relative;
  transition: color 0.3s ease;
  font-size: 11px;
  line-height: 1.2;
}

#basicLayout .footer a::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg, #53a2ff, #6b6bff);
  transform: scaleX(0);
  transform-origin: right;
  transition: transform 0.3s ease;
}

#basicLayout .footer a:hover {
  color: #53a2ff;
}

#basicLayout .footer a:hover::after {
  transform: scaleX(1);
  transform-origin: left;
}

</style>
