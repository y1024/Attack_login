package handlers

import (
	"sync"
	"time"

	"github.com/google/uuid"
)

// SessionManager 负责在内存中维护登录会话
type SessionManager struct {
	mu       sync.RWMutex
	sessions map[string]time.Time
	ttl      time.Duration
}

// NewSessionManager 创建 session 管理器
func NewSessionManager(ttl time.Duration) *SessionManager {
	return &SessionManager{
		sessions: make(map[string]time.Time),
		ttl:      ttl,
	}
}

// CreateSession 生成一个新的 session token
func (sm *SessionManager) CreateSession() string {
	token := uuid.NewString()
	sm.mu.Lock()
	sm.sessions[token] = time.Now().Add(sm.ttl)
	sm.mu.Unlock()
	return token
}

// ValidateSession 校验 session 是否有效
func (sm *SessionManager) ValidateSession(token string) bool {
	if token == "" {
		return false
	}

	sm.mu.RLock()
	expireAt, exists := sm.sessions[token]
	sm.mu.RUnlock()
	if !exists {
		return false
	}

	if time.Now().After(expireAt) {
		sm.mu.Lock()
		delete(sm.sessions, token)
		sm.mu.Unlock()
		return false
	}

	return true
}

// RevokeSession 移除 session
func (sm *SessionManager) RevokeSession(token string) {
	if token == "" {
		return
	}

	sm.mu.Lock()
	delete(sm.sessions, token)
	sm.mu.Unlock()
}
