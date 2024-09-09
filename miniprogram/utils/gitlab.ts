/**
 * 使用 Gitlab api 查询仓库信息
 * API 参考: https://docs.gitlab.com/ee/api/repositories.html
 * 获取参考文件目录: https://gitlab.com/api/v4/projects/{projectId}/repository/tree?recursive=true&ref=分支名
 * gitlab api url 中的 query 必须与文档上的一致，不能随意使用 encodeURIComponent
 * *******/

// 项目配置
interface IProjectConfig {
  baseURL?: string;
  // project id
  id?: string | number;
  branch?: string;
  path: string; // mp3/xxx.mp3
  token?: string;
  // 是否递归查询
  recursive?: boolean;
}

type CustomRequired<T, K extends keyof T> = {
  [P in K]-?: T[P];
} & Omit<T, K>

export const ProjectCfg: IProjectConfig = {
  baseURL: 'https://gitlab.com/api/v4',
  id: 52878930,
  branch: 'main',
  path: '',
  token: '',
};

export async function fetch(url: string, param: any = {}) {
  return new Promise((resolve, reject) => {
    wx.request({
      url,
      data: param.body,
      header: param.headers,
      dataType: param.dataType || 'json',
      success ({data, statusCode}) {
        resolve(data);
      },
      fail(...a) {
        reject(a);
      }
    })
  });
}

export function setProjectConfig(cfg: any) {
  Object.assign(ProjectCfg, cfg);
}

export interface IRepositoryFile {
  id: string;
  name: string;
  type: string;
  path: string;
  mode: string;
}
// 获取仓库目录结构
export const getRepositoryTree = async (projectCfg: Partial<IProjectConfig>): Promise<any[]> => {
  const _project = {...ProjectCfg, ...projectCfg};
  const param = {
    private_token: _project.token,
    ref: _project.branch,
    recursive: _project.recursive || false,
  };
  const url = `${_project.baseURL}/projects/${_project.id}/repository/tree/?${transformQuery(param)}`;
  const response = await fetch(url, {method: 'GET'});
  return response as any;
};

// 接口响应
interface IFileListItem {
  id: string;
  name: string;
  type: string;
  path: string;
  mode: string;
}

// 分页配置
interface IPaging {
  page: number;
  per_page?: number;
}
// 获取路径下的文件列表
export async function getFilesOfPath(projectCfg: CustomRequired<IProjectConfig, 'path'>, paging: IPaging) {
  const _p = {...ProjectCfg, ...projectCfg};
  const param = {
    recursive: _p.recursive || false,
    private_token: _p.token,
    ref: _p.branch,
    path: _p.path,
    per_page: 30,
    ...paging,
  };
  const url = `${_p.baseURL}/projects/${_p.id}/repository/tree/?${transformQuery(param)}`;
  const response = await fetch(url, {method: 'GET'});
  return response as any;
}

// 下载单个 raw 文件
export async function downFile(projectCfg: CustomRequired<IProjectConfig, 'path'>) {
  const text = await fetch(getFileUrl(projectCfg), {method: 'GET', dataType: 'text'});
  try {
    return JSON.parse(text as any);
  } catch (_) {
    return text;
  }
}

/**
 * 获取单个 raw 文件
 * https://gitlab.com/api/v4/projects/52878930/repository/files/images%2FWechatIMG29.jpg/raw?private_token=xxx&ref=main
 * **/
export function getFileUrl(projectCfg: CustomRequired<IProjectConfig, 'path'>) {
  const _p = {...ProjectCfg, ...projectCfg};
  const filePath = encodeURIComponent(_p.path);
  const query = {
    private_token: _p.token,
    ref: _p.branch,
  };
  return `${_p.baseURL}/projects/${_p.id}/repository/files/${filePath}/raw?${transformQuery(query)}`;
}

/**
 * 创建一个commit: https://docs.gitlab.com/ee/api/commits.html#create-a-commit-with-multiple-files-and-actions
 * ********/
interface IAction {
  action: 'create' | 'delete' | 'move' | 'update' | 'chmod';
  previous_path?: string;
  file_path?: string;
  content?: string;
  encoding?: 'text' | 'base64';
  last_commit_id?: string;
  execute_filemode?: boolean;
}
async function createCommit(actions: IAction[], commitMsg: string, projectCfg: Partial<IProjectConfig>) {
  const _p = {...ProjectCfg, ...projectCfg};
  const url = `${_p.baseURL}/projects/${_p.id}/repository/commits`;
  const body = JSON.stringify({
    id: _p.id,
    branch: _p.branch,
    commit_message: commitMsg,
    actions,
  });
  const response = await fetch(url, {
    method: 'POST',
    // @ts-ignore
    headers: {
      'PRIVATE-TOKEN': _p.token,
      'Content-Type': 'application/json',
    },
    body,
  });
  return response;
}

/**
 * 上传文件
 * *****/
type IFile = {
  path: string;
  content: string;
};
export async function uploadLocalFiles(files: IFile[], commitMsg: string, projectConf: Partial<IProjectConfig>) {
  const actions: IAction[] = files.map((fileItem) => ({
    file_path: fileItem.path,
    action: 'create',
    encoding: 'base64',
    content: fileItem.content,
  }));
  await createCommit(actions, commitMsg, projectConf);
}

// 更新文件
export async function updateFile(content: any, commit_message: string, proConf: CustomRequired<IProjectConfig, 'path'>) {
  const _proConf = {...ProjectCfg, ...proConf};
  const filePath = encodeURIComponent(_proConf.path);
  const param = {
    private_token: _proConf.token,
    ref: _proConf.branch,
  };
  if ([undefined, null].includes(content)) {
    content = '';
  } else if (typeof content === 'object') {
    try {
      content = JSON.stringify(content, null, 2);
    } catch (e) {
      throw new Error('updateFile(content) 中的 content 无法json序列化');
    }
  }
  const body = JSON.stringify({
    branch: param.ref,
    commit_message,
    content,
    file_path: filePath,
    id: _proConf.id,
  });
  const url = `${_proConf.baseURL}/projects/${_proConf.id}/repository/files/${filePath}?${transformQuery(param)}`;
  return await fetch(url, {
    method: 'PUT',
    // @ts-ignore
    headers: {
      'PRIVATE-TOKEN': _proConf.token,
      'Content-Type': 'application/json',
    },
    body,
  });
}

// 删除文件
export async function delFiles(files: string | string[], commitMsg: string, proConf: Partial<IProjectConfig>) {
  if (!files || !files?.length) {return;}
  if (!Array.isArray(files)) {
    files = [files];
  }
  const actions: IAction[] = files.map(s => ({
    file_path: s,
    action: 'delete',
  }));
  return createCommit(actions, commitMsg, proConf);
}

function transformQuery(val: string | object): string | object {
  if (typeof val === 'string') {
    val = decodeURIComponent(val);
    return val.split('&').reduce((acc, itemStr) => {
      let [k, v]: [string, string | number] = itemStr.split('=') as [string, string];
      v = Number.isNaN(Number(v)) ? v : Number(v);
      acc[k] = v;
      return acc;
    }, {});
  }
  if (typeof val === 'object') {
    return Object.getOwnPropertyNames(val)
      .map(k => `${k}=${val[k]}`)
      .join('&');
  }
  return val;
}
