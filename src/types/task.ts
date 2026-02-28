// 任务状态类型
export type TaskStatus = "ready" | "consuming" | "downloading" | "completed" | "failed";

// 任务类型
export type TaskType = "bili_video";

// 任务接口
export interface Task {
  id: number;
  task_type: TaskType;
  task_key: string;
  task_data: string;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  error_message: string | null;
}

// 任务列表响应
export interface TaskListResponse {
  items: Task[];
  total: number;
  page: number;
  page_size: number;
}

// 任务查询参数
export interface TaskQuery {
  page?: number;
  page_size?: number;
  status?: TaskStatus;
}

// 创建任务请求
export interface CreateTaskRequest {
  bid: string;
  favid?: string;
  selected_episodes?: number[];
}

// 创建任务响应
export interface CreateTaskResponse {
  status: "success" | "already_queued" | "already_downloaded";
  message: string;
}

// 任务统计
export interface TaskStats {
  ready: number;
  consuming: number;
  downloading: number;
  completed: number;
  failed: number;
}
