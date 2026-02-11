import axios from "axios";

// 从环境变量读取后端 API 地址
// 如果未配置 VITE_API_BASE_URL，则使用默认值 "/api"（相对路径，与页面同源）
// 开发环境: Vite 会将请求代理到 VITE_API_BASE_URL 指定的地址
// 生产环境: 使用相对路径或完整 URL 发送请求
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

// 创建 axios 实例
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 导出 API_BASE_URL 供其他模块使用
export { API_BASE_URL };

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // 统一错误处理
    const message = error.response?.data?.detail || error.message || "请求失败";
    console.error("API Error:", message);
    return Promise.reject(new Error(message));
  }
);
