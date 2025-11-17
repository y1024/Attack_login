package config

import (
	"encoding/json"
	"os"
	"sync"
)

type Config struct {
	Password string `json:"password"`
	Port     string `json:"port"`
}

var (
	instance *Config
	once     sync.Once
)

// LoadConfig 加载配置文件
func LoadConfig() (*Config, error) {
	var err error
	once.Do(func() {
		config := &Config{
			Password: "admin123", // 默认密码
			Port:     "18921",    // 默认端口
		}

		// 尝试读取配置文件
		data, readErr := os.ReadFile("config.json")
		if readErr == nil {
			// 如果文件存在，解析 JSON
			if parseErr := json.Unmarshal(data, config); parseErr != nil {
				err = parseErr
				return
			}
		}
		// 如果文件不存在，使用默认值

		instance = config
	})

	if err != nil {
		return nil, err
	}

	return instance, nil
}

// GetConfig 获取配置实例
func GetConfig() *Config {
	if instance == nil {
		instance, _ = LoadConfig()
	}
	return instance
}

