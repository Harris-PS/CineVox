const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000'

export { API_URL, WS_URL }

export const api = {
  auth: {
    register: `${API_URL}/api/auth/register`,
    login: `${API_URL}/api/auth/login`,
    me: `${API_URL}/api/auth/me`,
  },
  media: {
    list: `${API_URL}/api/media`,
    trending: `${API_URL}/api/media/trending`,
    detail: (id: string) => `${API_URL}/api/media/${id}`,
    admin: `${API_URL}/api/media/admin/all`,
  },
  rooms: {
    list: `${API_URL}/api/rooms`,
    create: `${API_URL}/api/rooms`,
    detail: (id: string) => `${API_URL}/api/rooms/${id}`,
    join: (id: string) => `${API_URL}/api/rooms/${id}/join`,
    leave: (id: string) => `${API_URL}/api/rooms/${id}/leave`,
  },
  friends: {
    list: `${API_URL}/api/friends`,
    request: `${API_URL}/api/friends/request`,
    accept: (id: string) => `${API_URL}/api/friends/request/${id}/accept`,
    reject: (id: string) => `${API_URL}/api/friends/request/${id}`,
    remove: (id: string) => `${API_URL}/api/friends/${id}`,
    pending: `${API_URL}/api/friends/pending`,
  },
}
