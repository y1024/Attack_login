package services

import (
	"batch-connector/internal/models"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
)

type ConnectorService struct {
	db *sql.DB
}

func NewConnectorService() (*ConnectorService, error) {
	db, err := initDatabase()
	if err != nil {
		return nil, fmt.Errorf("初始化数据库失败: %v", err)
	}

	return &ConnectorService{
		db: db,
	}, nil
}

// AddConnection 添加连接信息
func (s *ConnectorService) AddConnection(conn *models.Connection) error {
	values, err := connectionToValues(conn)
	if err != nil {
		return fmt.Errorf("序列化连接数据失败: %v", err)
	}

	insertSQL := `INSERT INTO connections 
		(id, type, ip, port, user, pass, status, message, result, logs, created_at, connected_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

	_, err = s.db.Exec(insertSQL, values...)
	if err != nil {
		return fmt.Errorf("插入连接失败: %v", err)
	}

	return nil
}

// GetConnection 获取连接信息
func (s *ConnectorService) GetConnection(id string) (*models.Connection, bool) {
	querySQL := `SELECT id, type, ip, port, user, pass, status, message, result, logs, created_at, connected_at
		FROM connections WHERE id = ?`

	row := s.db.QueryRow(querySQL, id)
	conn, err := connectionFromRow(row)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, false
		}
		return nil, false
	}

	return conn, true
}

// GetAllConnections 获取所有连接信息
func (s *ConnectorService) GetAllConnections() []*models.Connection {
	querySQL := `SELECT id, type, ip, port, user, pass, status, message, result, logs, created_at, connected_at
		FROM connections ORDER BY created_at DESC`

	rows, err := s.db.Query(querySQL)
	if err != nil {
		return []*models.Connection{}
	}
	defer rows.Close()

	connections := []*models.Connection{}
	for rows.Next() {
		conn, err := connectionFromRows(rows)
		if err != nil {
			continue
		}
		connections = append(connections, conn)
	}

	return connections
}

// GetConnectionsByType 按类型获取连接
func (s *ConnectorService) GetConnectionsByType(connType string) []*models.Connection {
	querySQL := `SELECT id, type, ip, port, user, pass, status, message, result, logs, created_at, connected_at
		FROM connections WHERE type = ? ORDER BY created_at DESC`

	rows, err := s.db.Query(querySQL, connType)
	if err != nil {
		return []*models.Connection{}
	}
	defer rows.Close()

	connections := []*models.Connection{}
	for rows.Next() {
		conn, err := connectionFromRows(rows)
		if err != nil {
			continue
		}
		connections = append(connections, conn)
	}

	return connections
}

// DeleteConnection 删除连接
func (s *ConnectorService) DeleteConnection(id string) bool {
	deleteSQL := `DELETE FROM connections WHERE id = ?`
	result, err := s.db.Exec(deleteSQL, id)
	if err != nil {
		return false
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return false
	}

	return rowsAffected > 0
}

// UpdateConnection 更新连接信息（用于更新状态、日志等）
func (s *ConnectorService) UpdateConnection(conn *models.Connection) error {
	// 序列化日志
	logsJSON := "[]"
	if conn.Logs != nil && len(conn.Logs) > 0 {
		jsonData, err := json.Marshal(conn.Logs)
		if err != nil {
			return fmt.Errorf("序列化日志失败: %v", err)
		}
		logsJSON = string(jsonData)
	}

	// 格式化时间
	connectedAtStr := ""
	if !conn.ConnectedAt.IsZero() {
		connectedAtStr = conn.ConnectedAt.Format(time.RFC3339)
	}

	updateSQL := `UPDATE connections SET 
		status = ?, message = ?, result = ?, logs = ?, connected_at = ?
		WHERE id = ?`

	_, err := s.db.Exec(updateSQL,
		conn.Status,
		conn.Message,
		conn.Result,
		logsJSON,
		connectedAtStr,
		conn.ID,
	)
	if err != nil {
		return fmt.Errorf("更新连接失败: %v", err)
	}

	return nil
}

// UpdateConnectionInfo 更新连接基本信息（type, ip, port, user, pass）
func (s *ConnectorService) UpdateConnectionInfo(id, connType, ip, port, user, pass string) error {
	updateSQL := `UPDATE connections SET 
		type = ?, ip = ?, port = ?, user = ?, pass = ?
		WHERE id = ?`

	_, err := s.db.Exec(updateSQL, connType, ip, port, user, pass, id)
	if err != nil {
		return fmt.Errorf("更新连接信息失败: %v", err)
	}

	return nil
}

// DeleteBatchConnections 批量删除连接
func (s *ConnectorService) DeleteBatchConnections(ids []string) (int, error) {
	if len(ids) == 0 {
		return 0, nil
	}

	// 构建占位符
	placeholders := strings.Repeat("?,", len(ids))
	placeholders = placeholders[:len(placeholders)-1] // 移除最后一个逗号

	deleteSQL := fmt.Sprintf("DELETE FROM connections WHERE id IN (%s)", placeholders)

	// 将 []string 转换为 []interface{}
	args := make([]interface{}, len(ids))
	for i, id := range ids {
		args[i] = id
	}

	result, err := s.db.Exec(deleteSQL, args...)
	if err != nil {
		return 0, fmt.Errorf("批量删除连接失败: %v", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return 0, fmt.Errorf("获取删除行数失败: %v", err)
	}

	return int(rowsAffected), nil
}

// CreateConnectionFromCSV 从 CSV 数据创建连接
func (s *ConnectorService) CreateConnectionFromCSV(connType, ip, port, user, pass string) *models.Connection {
	return &models.Connection{
		ID:        uuid.New().String(),
		Type:      connType,
		IP:        ip,
		Port:      port,
		User:      user,
		Pass:      pass,
		Status:    "pending",
		CreatedAt: time.Now(),
	}
}
