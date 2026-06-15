<template>
    <view class="error-container">
        <view class="error-card">
            <text class="error-eyebrow">小群友</text>
            <text class="error-title">页面走丢了</text>
            <text class="error-copy">{{ errMsg || '暂时找不到你要访问的页面' }}</text>
            <button class="home-btn" @click="goHome">返回首页</button>
        </view>
    </view>
</template>

<script>
    export default {
        data() {
            return {
                errMsg: ''
            }
        },
        onLoad(query) {
            this.errMsg = query.errMsg || ''
        },
        methods: {
            goHome() {
                uni.switchTab({
                    url: '/pages/circle/circle'
                })
            }
        }
    }
</script>

<style lang="scss" scoped>
.error-container {
    min-height: 100vh;
    padding: calc(var(--status-bar-height) + 48px) 18px 18px;
    background:
        radial-gradient(circle at top left, rgba(255, 255, 255, 0.95), transparent 34%),
        radial-gradient(circle at bottom right, rgba(231, 200, 171, 0.72), transparent 32%),
        linear-gradient(160deg, #f7f1eb 0%, #efe2d4 46%, #ead8c6 100%);
    color: #2f241d;
    box-sizing: border-box;
}

.error-card {
    padding: 22px 18px;
    border-radius: 24px;
    background:
        radial-gradient(circle at top right, rgba(255, 255, 255, 0.4), transparent 28%),
        linear-gradient(135deg, #86502a, #ad6a34 58%, #d79b68);
    box-shadow: 0 18px 35px rgba(114, 64, 28, 0.24);
    color: #fff9f4;
}

.error-eyebrow {
    display: inline-flex;
    align-items: center;
    align-self: flex-start;
    padding: 7px 10px;
    margin-bottom: 12px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.16);
    font-size: 11px;
    font-weight: 800;
}

.error-title {
    display: block;
    font-size: 22px;
    font-weight: 900;
    line-height: 1.18;
}

.error-copy {
    display: block;
    margin-top: 10px;
    color: rgba(255, 249, 244, 0.88);
    font-size: 14px;
    line-height: 1.65;
}

.home-btn {
    width: 100%;
    height: 48px;
    line-height: 48px;
    margin: 18px 0 0;
    padding: 0 16px;
    border: 0;
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.9);
    color: #9c5b2e;
    font-size: 15px;
    font-weight: 900;
}

.home-btn::after {
    border: none;
}
</style>
