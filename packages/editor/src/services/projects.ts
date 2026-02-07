import http from './http'
import type { ServerProject, ProjectInput } from '@vela/core/contracts'

// API 响应类型
export type { ServerProject, ProjectInput }

export async function listProjects(): Promise<ServerProject[]> {
  const res = await http.get('/projects')
  return res.data?.data || []
}

export async function getProject(id: string): Promise<ServerProject | null> {
  const res = await http.get(`/projects/${id}`)
  return res.data?.data || null
}

export async function createProject(payload: ProjectInput): Promise<ServerProject> {
  const res = await http.post('/projects', payload)
  return res.data?.data
}

export async function updateProject(
  id: string,
  payload: Partial<ProjectInput>,
): Promise<ServerProject> {
  const res = await http.put(`/projects/${id}`, payload)
  return res.data?.data
}

export async function deleteProject(id: string): Promise<void> {
  await http.delete(`/projects/${id}`)
}

export default {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
}
