package models

import (
	"time"
)

type Portfolio struct {
	ID               string    `gorm:"primaryKey;type:varchar(36)" json:"id"`
	CompanyName      string    `gorm:"not null" json:"company_name"`
	OriginalFileName string    `gorm:"not null" json:"original_file_name"`
	FilePath         string    `gorm:"not null" json:"file_path"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}
