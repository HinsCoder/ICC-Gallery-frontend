<template>
  <div>
    <!-- 悬浮按钮 (可拖拽，模态框未打开时显示) -->
    <a-float-button
      v-show="!isModalVisible"
      v-draggable
      :style="floatButtonPosition"
      type="primary"
      @click="handleClickFloatButton"
      tooltip="AI 助手"
      class="ai-float-button"
    >
      <template #icon>
        <img :src="logoUrl" alt="AI Logo" class="float-button-logo" style="pointer-events: none;" />
      </template>
    </a-float-button>

    <!-- 聊天模态框 -->
    <a-modal
      v-model:open="isModalVisible"
      :footer="null"
      @cancel="handleCancel"
      wrapClassName="ai-assistant-modal"
      :maskClosable="false"
      width="400px"
      :bodyStyle="{ padding: '0', height: '500px', display: 'flex', flexDirection: 'column' }"
      :closable="false"
      :mask="false"
      :style="modalPositionStyle"
    >
      <!-- 自定义模态框标题栏 -->
      <template #title>
        <div class="modal-custom-header" ref="modalHeaderRef">
          <span class="header-title">AI 助手</span>
          <div class="header-icons">
            <a-tooltip title="刷新对话">
              <ReloadOutlined @click.stop="resetChat" class="header-icon" />
            </a-tooltip>
            <a-tooltip title="关闭">
              <CloseOutlined @click.stop="handleCancel" class="header-icon" />
            </a-tooltip>
          </div>
        </div>
      </template>

      <!-- 聊天内容区域 -->
      <div class="chat-body">
        <!-- 初始欢迎界面 -->
        <div v-if="showInitialView" class="initial-view">
          <img :src="logoUrl" alt="AI Logo" class="initial-view-logo" />
          <h2 class="initial-view-heading">你好，我是你的 AI 助手</h2>
          <p class="initial-view-subheading">您可以尝试点击下方的快捷入口开启体验！</p>
          <div class="suggestion-list">
            <a-button
              v-for="suggestion in promptSuggestions"
              :key="suggestion"
              @click="sendSuggestion(suggestion)"
              class="suggestion-button"
            >
              {{ suggestion }}
            </a-button>
          </div>
        </div>

        <!-- 聊天记录 -->
        <div v-else ref="chatHistoryRef" class="chat-history">
          <a-list
            item-layout="horizontal"
            :data-source="messages"
            class="message-list"
          >
            <template #renderItem="{ item }">
              <a-list-item :key="item.id" :class="['message-item', item.sender === 'user' ? 'user-message-item' : 'ai-message-item']">
                <a-list-item-meta>
                  <template #avatar>
                    <a-avatar v-if="item.sender === 'user'" class="chat-avatar user-avatar" :src="userAvatarSrc">
                      <UserOutlined />
                    </a-avatar>
                    <a-avatar v-else :src="logoUrl" class="chat-avatar ai-avatar" />
                  </template>
                  <template #description>
                    <div :class="['message-bubble', item.sender === 'user' ? 'user-bubble' : 'ai-bubble']">
                      <div class="message-content-text" v-html="renderMarkdown(item.content)"></div>
                    </div>
                  </template>
                </a-list-item-meta>
              </a-list-item>
            </template>
          </a-list>
          <div v-if="isLoading" class="loading-indicator">
            <a-spin size="small" /> 正在思考中... (点击发送按钮可停止)
          </div>
        </div>
      </div>

      <!-- 预测输入建议 -->
      <div v-if="showFollowUpSuggestions && !isLoading" class="follow-up-suggestions">
        <a-button
          v-for="suggestion in followUpSuggestions"
          :key="suggestion"
          @click="applySuggestion(suggestion)"
          size="small"
          type="dashed"
          class="follow-up-button"
        >
          {{ suggestion }}
        </a-button>
      </div>

      <!-- 输入区域 -->
      <div class="input-area-container">
        <div class="chat-input-area">
          <a-textarea
            ref="inputRef"
            v-model:value="currentInput"
            :placeholder="inputPlaceholder"
            :auto-size="{ minRows: 1, maxRows: 3 }"
            @pressEnter.prevent="handleSendOrStop"
            @input="handleUserInput"
            :disabled="isLoading && !abortController"
          />
          <!-- 使用 span 包裹按钮，并添加捕获事件监听器，用于停止生成 -->
          <span @click.capture="captureClick">
            <a-button
              type="primary"
              @click="handleSendOrStop"
              :loading="isLoading"
              :disabled="!isLoading && !currentInput.trim()"
              :title="isLoading ? '点击停止生成' : '发送'"
              class="send-stop-button"
            >
              <template #icon>
                 <SendOutlined v-if="!isLoading"/>
              </template>
            </a-button>
          </span>
        </div>
        <div class="disclaimer-text">内容由 AI 生成，仅供参考</div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick, onUnmounted, computed, watch } from 'vue';
import { Modal as AModal, FloatButton as AFloatButton, Input as AInput, Button as AButton, List as AList, ListItem as AListItem, ListItemMeta as AListItemMeta, Spin as ASpin, Tooltip as ATooltip, Avatar as AAvatar } from 'ant-design-vue';
import { ReloadOutlined, CloseOutlined, SendOutlined, UserOutlined } from '@ant-design/icons-vue';
import { marked } from 'marked';
import logoUrl from '@/assets/ai-logo.png';
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts';

const loginUserStore = useLoginUserStore();

// Refs
const modalHeaderRef = ref(null); // 模态框标题栏 Ref
const isDraggingModal = ref(false); // 模态框是否正在拖拽
const modalPosition = ref({ right: 20, bottom: 20 }); // 模态框位置 (像素值，初始 CSS 值)
let startX = 0; // 鼠标按下时的 X 坐标
let startY = 0; // 鼠标按下时的 Y 坐标
let modalElement = null; // 存储 .ant-modal 元素
let inactivityTimerId = null; // 不活动超时定时器 ID
const INACTIVITY_TIMEOUT = 20000; // 超时时间 (毫秒)
let wasTimedOut = false; // 标记是否因超时中止

// 状态和配置
const isModalVisible = ref(false);
const currentInput = ref('');
const messages = reactive([]);
const isLoading = ref(false);
const chatHistoryRef = ref(null);
const inputRef = ref(null);
let abortController = null;
let messageIdCounter = 0;
const currentSessionId = ref(null); // 会话 ID 状态
const INITIAL_GREETING = '您好！有什么可以帮助您的吗？';
const promptSuggestions = reactive([
  '智能协作云图库采用了哪些技术栈？',
  '介绍一下团队协作的功能',
  '如何使用AI扩图？',
  '该项目的作者是谁，我要吐槽！'
]);
const showFollowUpSuggestions = ref(false);
const followUpSuggestions = reactive([
  '能再详细解释一下吗？',
  '换个角度看呢？',
  '还有其他相关信息吗？',
  '请用Mermaid流程图演示'
]);

const floatButtonPosition = ref({
  right: '24px',
  bottom: '60px',
});

const isDraggingRef = ref(false); // 用于区分悬浮按钮拖拽和点击

// 计算属性
const modalPositionStyle = computed(() => ({ // 生成模态框 style
  right: `${modalPosition.value.right}px`,
  bottom: `${modalPosition.value.bottom}px`,
  position: 'fixed',
  margin: 0,
  top: 'auto',
  left: 'auto',
}));

const userAvatarSrc = computed(() => {
  if (loginUserStore.loginUser?.id) { // 检查用户是否已登录
    return loginUserStore.loginUser.userAvatar || getDefaultAvatar(loginUserStore.loginUser.userName);
  }
  return null; // 返回 null 使用默认头像 slot
});

const getDefaultAvatar = (userName) => {
  const defaultName = userName || 'Guest';
  return `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${encodeURIComponent(defaultName)}
  &backgroundColor=059ff2,71cf62,f6d594,b6e3f4,c0aede,ffd5dc,d1d4f9,ffdfbf&backgroundType=solid,gradientLinear`;
};

const showInitialView = computed(() => { // 判断是否显示初始欢迎界面
  return messages.length === 0 || (messages.length === 1 && messages[0].sender === 'ai' && messages[0].content === INITIAL_GREETING);
});
const inputPlaceholder = computed(() => { // 输入框占位符文本
  return showInitialView.value ? '可以直接点击上方快捷入口提问' : '有什么可以帮您的吗？';
});

// 方法

// 获取模态框根元素 (.ant-modal)
const getModalElement = () => {
  if (modalHeaderRef.value) {
    return modalHeaderRef.value.closest('.ant-modal');
  }
  return null;
};

// 模态框拖拽逻辑 (onModalMouseDown, onModalMouseMove, onModalMouseUp)
const onModalMouseDown = (event) => {
  if (event.button !== 0) return; // 仅响应鼠标左键
  if (event.target.closest('.header-icon')) return; // 忽略头部图标点击
  modalElement = getModalElement();
  if (!modalElement) return; // 模态框元素未找到则退出
  isDraggingModal.value = true;
  startX = event.clientX;
  startY = event.clientY;
  if (modalHeaderRef.value) modalHeaderRef.value.style.cursor = 'grabbing';
  document.body.style.userSelect = 'none';
  document.addEventListener('mousemove', onModalMouseMove);
  document.addEventListener('mouseup', onModalMouseUp, { once: true });
};
const onModalMouseMove = (event) => {
  if (!isDraggingModal.value || !modalElement) return;
  const dx = event.clientX - startX;
  const dy = event.clientY - startY;
  modalPosition.value.right -= dx;
  modalPosition.value.bottom -= dy;
  const modalRect = modalElement.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  if (modalPosition.value.right < 0) modalPosition.value.right = 0;
  if (modalPosition.value.right > viewportWidth - modalRect.width) modalPosition.value.right = viewportWidth - modalRect.width;
  if (modalPosition.value.bottom < 0) modalPosition.value.bottom = 0;
  if (modalPosition.value.bottom > viewportHeight - modalRect.height) modalPosition.value.bottom = viewportHeight - modalRect.height;
  startX = event.clientX;
  startY = event.clientY;
};
const onModalMouseUp = () => {
  if (!isDraggingModal.value) return;
  isDraggingModal.value = false;
  if (modalHeaderRef.value) modalHeaderRef.value.style.cursor = 'grab';
  document.body.style.userSelect = '';
  document.removeEventListener('mousemove', onModalMouseMove);
};

// 监听模态框可见性，添加/移除拖拽监听器
watch(isModalVisible, (newValue) => {
  if (newValue) {
    nextTick(() => { // 等待 DOM 更新
      if (modalHeaderRef.value) {
        modalHeaderRef.value.style.cursor = 'grab'; // 设置初始抓取光标
        modalHeaderRef.value.addEventListener('mousedown', onModalMouseDown);
      } else {
        console.error("Failed to attach listener: modalHeaderRef is null.");
      }
    });
  } else {
    // 模态框关闭
    if (modalHeaderRef.value) {
      modalHeaderRef.value.style.cursor = ''; // 清除光标样式
      modalHeaderRef.value.removeEventListener('mousedown', onModalMouseDown);
      document.removeEventListener('mousemove', onModalMouseMove);
      document.removeEventListener('mouseup', onModalMouseUp);
      if (isDraggingModal.value) { // 如果关闭时正在拖拽
        isDraggingModal.value = false;
        document.body.style.userSelect = '';
      }
    }
  }
});

// 组件卸载时清理
onUnmounted(() => {
  if (modalHeaderRef.value) {
    modalHeaderRef.value.removeEventListener('mousedown', onModalMouseDown);
  }
  document.removeEventListener('mousemove', onModalMouseMove);
  document.removeEventListener('mouseup', onModalMouseUp);
  stopGeneration();
  clearTimeout(inactivityTimerId);
});

// 添加初始问候语
const addInitialGreeting = () => {
  if (messages.length === 0) {
    messages.push({ id: messageIdCounter++, sender: 'ai', content: INITIAL_GREETING });
  }
};

// 悬浮按钮点击处理
const handleClickFloatButton = () => {
  if (isDraggingRef.value) { // 如果是拖拽结束，阻止点击
    nextTick(() => { isDraggingRef.value = false; });
    return;
  }
  showModal(); // 显示模态框
};

// 显示模态框
const showModal = () => {
  modalPosition.value = { right: 20, bottom: 20 }; // 打开时重置位置
  isModalVisible.value = true;
  addInitialGreeting();
  nextTick(() => {
    scrollToBottom();
    inputRef.value?.focus(); // 聚焦输入框
  });
};

// 关闭模态框
const handleCancel = () => {
  isModalVisible.value = false;
  stopGeneration(); // 关闭时停止生成
};

// 滚动聊天记录到底部
const scrollToBottom = async () => {
  await nextTick(); // 确保 DOM 更新
  const element = chatHistoryRef.value;
  if (!showInitialView.value && element) { // 仅在聊天视图滚动
    element.scrollTo({ top: element.scrollHeight, behavior: 'auto' });
  }
};

// Markdown 渲染
const renderer = new marked.Renderer();
renderer.link = (href, title, text) => { // 自定义链接渲染，新标签页打开
  return `<a target="_blank" href="${href}" title="${title || ''}">${text}</a>`;
};
const escapeHtml = (unsafe) => {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
const renderMarkdown = (text) => { // Markdown 渲染函数
  if (!text) return '';
  try {
    return marked(text, {
      renderer: renderer,
      gfm: true,
      breaks: true,
    });
  } catch (e) {
    console.error("Markdown 解析错误:", e, "\n输入文本:", text);
    return escapeHtml(text).replace(/\n/g, '<br>'); // HTML 转义出错文本
  }
};

// 停止/发送按钮点击处理
// 捕获层：加载时点击停止生成
const captureClick = (event) => {
  if (isLoading.value) {
    event.stopPropagation(); // 阻止事件冒泡到按钮 click handler
    stopGeneration();
  }
};

// 实际处理层：发送消息或停止
const handleSendOrStop = (event) => {
  if (!isLoading.value) {
    sendMessage(); // 非加载状态发送消息
  } else {
    stopGeneration(); // 加载状态停止生成
  }
};

// 停止生成
const stopGeneration = () => {
  if (abortController) {
    abortController.abort(); // 中止 fetch 请求
    abortController = null;
  }
  clearTimeout(inactivityTimerId);
  inactivityTimerId = null;
};

// 发送消息
const sendMessage = async () => {
  showFollowUpSuggestions.value = false; // 隐藏建议
  const trimmedInput = currentInput.value.trim();
  if (!trimmedInput || isLoading.value) return; // 空输入或加载中不发送

  if (messages.length === 1 && messages[0].sender === 'ai' && messages[0].content === INITIAL_GREETING) {
    messages.length = 0; // 清除初始问候语
    messageIdCounter = 0;
  }

  const userMessage = { id: messageIdCounter++, sender: 'user', content: trimmedInput };
  messages.push(userMessage);
  const promptToSend = currentInput.value;
  currentInput.value = ''; // 清空输入框
  await scrollToBottom();

  isLoading.value = true; // 设置加载状态
  wasTimedOut = false;
  const aiMessage = reactive({ id: messageIdCounter++, sender: 'ai', content: '' });
  messages.push(aiMessage);
  await scrollToBottom();

  abortController = new AbortController();
  const signal = abortController.signal;

  let success = false;

  const payload = { prompt: promptToSend };
  if (currentSessionId.value) {
    payload.sessionId = currentSessionId.value;
  }

  // 超时处理函数
  const handleInactivityTimeout = () => {
    wasTimedOut = true;
    clearTimeout(inactivityTimerId);
    inactivityTimerId = null;
    const timeoutMsg = "\n\n*(服务器繁忙，请稍后再试)*";
    if (!aiMessage.content.endsWith(timeoutMsg)) {
      aiMessage.content += timeoutMsg;
      nextTick(scrollToBottom);
    }
    stopGeneration();
    isLoading.value = false;
  };

  try {
    clearTimeout(inactivityTimerId);
    const response = await fetch('/api/chatbot/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify(payload),
      signal: signal
    });

    if (signal.aborted) throw new DOMException('请求在响应处理前被中止', 'AbortError');
    if (!response.ok) throw new Error(`网络错误: ${response.status} ${response.statusText}`);
    if (!response.body) throw new Error('响应体不可用');

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = '';
    let lastScrollTime = 0;
    const scrollInterval = 100;

    while (true) {
      clearTimeout(inactivityTimerId);
      inactivityTimerId = setTimeout(handleInactivityTimeout, INACTIVITY_TIMEOUT);
      let value,done;
      try {
        ({ done, value } = await reader.read());
        clearTimeout(inactivityTimerId);
        inactivityTimerId = null;
      } catch (readError) {
        clearTimeout(inactivityTimerId);
        inactivityTimerId = null;
        if (signal.aborted) {
          throw new DOMException('数据流读取在 read 调用期间被中止', 'AbortError');
        } else {
          throw readError;
        }
      }

      if (signal.aborted) {
        reader.cancel('用户在读取后中止').catch(e => console.warn("读取后取消 reader 时出错:", e));
        throw new DOMException('数据流读取在读取后被中止', 'AbortError');
      }

      if (done) {
        if (buffer.trim()) {
          const lines = buffer.split('\n');
          for (const line of lines) {
            if (line.startsWith('data:')) {
              const jsonData = line.substring(5).trim();
              if (!jsonData) continue;
              try {
                const parsedData = JSON.parse(jsonData);
                const sessionIdFromResponse = parsedData.output?.session_id;
                if (sessionIdFromResponse) {
                  currentSessionId.value = sessionIdFromResponse;
                }
                const textToAdd = parsedData.output?.text;
                if (textToAdd !== undefined && textToAdd !== null) {
                  aiMessage.content += textToAdd;
                }
              } catch (e) {
                console.error("最后的 JSON 解析错误:", e, "\n原始 JSON 数据:", jsonData);
                aiMessage.content += '\n[数据解析错误]';
              }
            }
          }
          await scrollToBottom();
        }
        break;
      }

      const decodedChunk = decoder.decode(value, { stream: true });
      buffer += decodedChunk;

      let boundaryIndex;
      while ((boundaryIndex = buffer.indexOf('\n\n')) >= 0) {
        if (signal.aborted) {
          throw new DOMException('数据流读取在消息处理前被中止', 'AbortError');
        }

        const message = buffer.substring(0, boundaryIndex);
        buffer = buffer.substring(boundaryIndex + 2);

        const lines = message.split('\n');
        for (const line of lines) {
          if (signal.aborted) {
            throw new DOMException('数据流读取在行处理前被中止', 'AbortError');
          }

          if (line.startsWith('data:')) {
            const jsonData = line.substring(5).trim();
            if (!jsonData) continue;
            try {
              const parsedData = JSON.parse(jsonData);

              const sessionIdFromResponse = parsedData.output?.session_id;
              if (sessionIdFromResponse && !currentSessionId.value) {
                currentSessionId.value = sessionIdFromResponse;
              } else if (sessionIdFromResponse && currentSessionId.value !== sessionIdFromResponse) {
                currentSessionId.value = sessionIdFromResponse;
              }

              const textToAdd = parsedData.output?.text;
              if (textToAdd !== undefined && textToAdd !== null) {
                aiMessage.content += textToAdd;
                const now = Date.now();
                if (now - lastScrollTime > scrollInterval) {
                  nextTick(() => scrollToBottom());
                  lastScrollTime = now;
                }
              }
            } catch (e) {
              console.error("JSON 解析错误:", e, "\n原始 JSON 数据:", jsonData);
              aiMessage.content += '\n[数据解析错误]';
              nextTick(() => scrollToBottom());
            }
          }
        }
      }
    }

    await nextTick(() => scrollToBottom());
    success = true;

  } catch (error) {
    clearTimeout(inactivityTimerId);
    inactivityTimerId = null;
    const lastMsgIndex = messages.findIndex(m => m.id === aiMessage.id);

    if (error.name === 'AbortError') {
      if (!wasTimedOut) {
        if (lastMsgIndex !== -1) {
          const stopText = '\n\n*(已停止)*';
          await nextTick();
          if (!messages[lastMsgIndex].content.endsWith(stopText)) {
            messages[lastMsgIndex].content += stopText;
            await nextTick(() => scrollToBottom());
          }
        }
      }
      success = false;
    } else {
      console.error('获取或处理 SSE 数据流时出错:', error);
      if(lastMsgIndex !== -1){
        if (messages[lastMsgIndex].content && !messages[lastMsgIndex].content.endsWith('\n\n')) {
          messages[lastMsgIndex].content += '\n\n';
        }
        messages[lastMsgIndex].content += `抱歉，处理时遇到问题：${error.message}`;
      } else {
        messages.push({ id: messageIdCounter++, sender: 'ai', content: `抱歉，发生了错误：${error.message}` });
      }
      success = false;
    }
  } finally {
    clearTimeout(inactivityTimerId);
    inactivityTimerId = null;
    isLoading.value = false;
    abortController = null;

    if (success) {
      showFollowUpSuggestions.value = true;
    }
    await nextTick(() => scrollToBottom());
    if (isModalVisible.value) {
      nextTick(() => inputRef.value?.focus());
    }
  }
};

// 应用建议到输入框
const applySuggestion = (suggestion) => {
  currentInput.value = suggestion;
  showFollowUpSuggestions.value = false;
  nextTick(() => inputRef.value?.focus());
};

// 用户输入时隐藏建议
const handleUserInput = () => {
  if (showFollowUpSuggestions.value) {
    showFollowUpSuggestions.value = false;
  }
};

// 发送预设建议
const sendSuggestion = (suggestion) => {
  currentInput.value = suggestion;
  sendMessage();
};

// 重置对话
const resetChat = () => {
  stopGeneration();
  messages.length = 0;
  messageIdCounter = 0;
  currentInput.value = '';
  isLoading.value = false;
  showFollowUpSuggestions.value = false;
  currentSessionId.value = null; // 重置时清除会话 ID
  addInitialGreeting();
  nextTick(() => {
    scrollToBottom();
    if (isModalVisible.value) inputRef.value?.focus();
  });
};

// 生命周期钩子
onUnmounted(() => {
  stopGeneration();
});

// v-draggable 指令，用于悬浮按钮拖拽
const vDraggable = {
  mounted: (el, binding) => {
    el.style.position = 'fixed'; el.style.cursor = 'grab';
    let startX, startY, initialRight, initialBottom;
    let isDragging = false; const dragThreshold = 5;
    const onMouseDown = (e) => {
      if (e.button !== 0) return;
      isDragging = false; isDraggingRef.value = false;
      startX = e.clientX; startY = e.clientY;
      initialRight = parseFloat(el.style.right || '0'); initialBottom = parseFloat(el.style.bottom || '0');
      if (isNaN(initialRight)) initialRight = parseFloat(floatButtonPosition.value.right) || 0;
      if (isNaN(initialBottom)) initialBottom = parseFloat(floatButtonPosition.value.bottom) || 0;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp, { once: true });
    };
    const onMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX; const dy = moveEvent.clientY - startY;
      if (!isDragging && (Math.abs(dx) > dragThreshold || Math.abs(dy) > dragThreshold)) {
        isDragging = true; isDraggingRef.value = true; el.style.cursor = 'grabbing';
      }
      if (isDragging) {
        let newRight = initialRight - dx; let newBottom = initialBottom - dy;
        const elRect = el.getBoundingClientRect(); const viewportWidth = window.innerWidth; const viewportHeight = window.innerHeight;
        if (newRight < 0) newRight = 0; if (newRight > viewportWidth - elRect.width) newRight = viewportWidth - elRect.width;
        if (newBottom < 0) newBottom = 0; if (newBottom > viewportHeight - elRect.height) newBottom = viewportHeight - elRect.height;
        el.style.right = `${newRight}px`; el.style.bottom = `${newBottom}px`;
        floatButtonPosition.value = { right: `${newRight}px`, bottom: `${newBottom}px` };
      }
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      if (isDragging) {
        el.style.cursor = 'grab';
        initialRight = parseFloat(el.style.right || '0');
        initialBottom = parseFloat(el.style.bottom || '0');
      }
    };
    el.addEventListener('mousedown', onMouseDown);
    el._cleanupDraggable = () => {
      el.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp);
    };
  },
  beforeUnmount: (el) => {
    if (el._cleanupDraggable) { el._cleanupDraggable(); }
  }
};

</script>

<style scoped>
/* Styles */

/* 用户消息 (右对齐) */
.user-message-item {
  justify-content: flex-end;
  margin-right: 10px; /* 添加右边距，将用户消息项向左推一点 */
}
.user-message-item :deep(.ant-list-item-meta) {
  display: flex;
  flex-direction: row-reverse;
  align-items: flex-start;
  gap: 8px;
}
.user-message-item :deep(.ant-list-item-meta-avatar) {
  margin-top: 2px;
}

/* 确保其他相关样式不变 */
.chat-history {
  flex-grow: 1;
  overflow-y: auto;
  padding: 16px 0 0 16px; /* 调整：右内边距设为0 */
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.1) transparent;
  background-color: #f4f6f8;
}
.message-list .ant-list-item {
  padding: 0 0 16px 0 !important; /* 保持右 padding 为 0 */
  border-bottom: none !important;
}

/* 悬浮按钮 */
.ai-float-button {
  z-index: 1001;
}
.ai-float-button :deep(.ant-float-btn-body) {
  background-color: #ffffff !important;
  box-shadow: 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05);
}

.ai-float-button :deep(.ant-float-btn-icon) {
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  width: 100%;
  height: 100%;

}

.float-button-logo {
  width: 30px;
  height: 30px;
  display: block;
}

/* 模态框基础样式 */
:global(.ai-assistant-modal .ant-modal) {
  margin: 0 !important;
  top: auto !important;
  left: auto !important;
  background: transparent !important;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12) !important;
  border-radius: 8px;
  z-index: 1000;
  padding: 0 !important;
}

:global(.ai-assistant-modal .ant-modal-content) {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fff !important;
  box-shadow: none !important;
  padding: 0 !important;
  border-radius: 8px;
}

:global(.ai-assistant-modal .ant-modal-header) {
  padding: 0;
  border-bottom: none;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  height: 30px;
}

:global(.ai-assistant-modal .ant-modal-body) {
  padding: 0 !important;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 自定义头部 */
.modal-custom-header {
  background-color: #1677ff;
  color: white;
  padding: 8px 16px 8px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  cursor: grab;
}

.header-title {
  font-size: 16px;
  font-weight: 500;
}

.header-icons {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  cursor: pointer;
  font-size: 16px;
  transition: color 0.3s;
}

.header-icon:hover {
  color: rgba(255, 255, 255, 0.8);
}

/* 聊天主体 */
.chat-body {
  flex-grow: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background-color: #f4f6f8;
}

/* 初始视图 */
.initial-view {
  padding: 30px 20px;
  text-align: center;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #fff;
}

.initial-view-logo {
  width: 48px;
  height: 48px;
  margin-bottom: 16px;
}

.initial-view-heading {
  font-size: 18px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.initial-view-subheading {
  font-size: 13px;
  color: #888;
  margin-bottom: 20px;
}

.suggestion-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  max-width: 300px;
}

.suggestion-button {
  background-color: #f5f5f5;
  border-color: #eee;
  color: #555;
  text-align: left;
  white-space: normal;
  height: auto;
  padding: 8px 12px;
  line-height: 1.4;
  font-size: 13px;
}

.suggestion-button:hover {
  background-color: #e0e0e0;
  border-color: #ddd;
  color: #333;
}

/* 聊天记录 */
.chat-history::-webkit-scrollbar { width: 6px; }
.chat-history::-webkit-scrollbar-track { background: transparent; }
.chat-history::-webkit-scrollbar-thumb { background-color: rgba(0, 0, 0, 0.1); border-radius: 3px; }
.chat-history::-webkit-scrollbar-thumb:hover { background-color: rgba(0, 0, 0, 0.2); }

.message-list { padding-left: 0; }
.message-item { display: flex; width: 100%; }

/* AI 消息 (默认左对齐) */
.ai-message-item { justify-content: flex-start; }
.ai-message-item :deep(.ant-list-item-meta) { display: flex; align-items: flex-start; gap: 0px; max-width: calc(100% - 40px); } /* 保持 AI 消息宽度限制 */
.ai-message-item :deep(.ant-list-item-meta-avatar) { margin-top: 2px; }

/* 用户消息 (右对齐) - margin-right 已在上面修改 */

/* 通用 Meta Content 和 Description 样式 */
.message-item :deep(.ant-list-item-meta-content) { flex: 1; margin: 0 !important; min-width: 0; }
.message-item :deep(.ant-list-item-meta-description) { line-height: normal; }

.chat-avatar { width: 32px; height: 32px; line-height: 32px !important; font-size: 18px !important; flex-shrink: 0; }
.user-avatar { background-color: #1890ff; color: white; }
.ai-avatar { background-color: #fff; }

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.user-avatar:has(img) {
  background-color: transparent;
}

/* 消息气泡 */
.message-bubble { padding: 8px 12px 0px 12px; border-radius: 8px; position: relative; word-break: break-word; width: fit-content; max-width: 100%; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.user-bubble { background-color: #ccebff; color: #333; border-radius: 8px 0 8px 8px; margin-left: auto; }
.ai-bubble { background-color: #ffffff; border: 1px solid #e8e8e8; color: #333; border-radius: 0 8px 8px 8px; margin-right: auto; }

/* 消息内容文本 */
.message-content-text { white-space: pre-wrap; word-wrap: break-word; overflow-wrap: break-word; text-align: left; display: block; line-height: 1.6; font-size: 14px; }
.message-content-text :deep(p) { margin-bottom: 0.5em; white-space: inherit; word-wrap: inherit; overflow-wrap: inherit; text-align: inherit; }
.message-content-text :deep(p:last-child) { margin-bottom: 0; }
.message-content-text :deep(ul),
.message-content-text :deep(ol) { padding-left: 20px; margin-bottom: 0.5em; }
.message-content-text :deep(li) { margin-bottom: 0.2em; }
.message-content-text :deep(pre) { background-color: #f0f2f5; padding: 12px; border-radius: 4px; overflow-x: auto; margin: 8px 0; border: 1px solid #e8e8e8; }
.message-content-text :deep(code) { font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 0.9em; line-height: 1.4; }
.message-content-text :deep(p > code),
.message-content-text :deep(li > code) { background-color: #f0f2f5; padding: 2px 5px; border-radius: 3px; margin: 0 2px; border: 1px solid #e8e8e8; }
.message-content-text :deep(pre code) { background-color: transparent !important; padding: 0 !important; border-radius: 0 !important; margin: 0 !important; border: none !important; white-space: pre; }
.message-content-text :deep(a) { color: #1677ff; text-decoration: none; }
.message-content-text :deep(a:hover) { text-decoration: underline; }
.message-content-text :deep(strong),
.message-content-text :deep(b) { font-weight: 600; }
.message-content-text :deep(br) { height: auto; }

/* 加载指示器 */
.loading-indicator { text-align: center; padding: 10px 16px; color: #888; font-size: 13px; background-color: #f4f6f8; }

/* 预测输入建议 */
.follow-up-suggestions { padding: 8px 16px; display: flex; flex-wrap: wrap; gap: 8px; background-color: #f4f6f8; border-top: 1px solid #e8e8e8; }
.follow-up-button { border-color: #d9d9d9; color: rgba(0, 0, 0, 0.88); font-size: 13px; }

/* 输入区域容器 */
.input-area-container { background-color: #fff; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; padding: 0; border-top: 1px solid #e8e8e8; flex-shrink: 0; }

.send-stop-button.ant-btn-loading {
  pointer-events: auto !important;
  cursor: pointer !important;
}

/* 输入区域 */
.chat-input-area { display: flex; align-items: flex-end; padding: 10px 12px; background-color: #fff; }
.chat-input-area .ant-input { flex-grow: 1; margin-right: 8px; line-height: 1.5; }
.chat-input-area .ant-btn { height: auto; min-height: 32px; display: flex; align-items: center; justify-content: center; }
.chat-input-area .ant-btn.ant-btn-loading { min-width: 70px; pointer-events: auto !important; cursor: pointer !important; }

/* 免责声明 */
.disclaimer-text { font-size: 11px; color: #aaa; text-align: center; padding: 4px 12px 6px 12px; background-color: #fff; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; }
</style>
