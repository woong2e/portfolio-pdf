package handlers

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/woong/portfolio-pdf/backend/database"
	"github.com/woong/portfolio-pdf/backend/models"
)

func ViewPortfolio(c *gin.Context) {
	id := c.Param("uuid")
	var portfolio models.Portfolio

	if err := database.DB.Where("id = ?", id).First(&portfolio).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Portfolio not found"})
		return
	}

	c.Header("Content-Type", "application/pdf")
	c.File(portfolio.FilePath)
}

func DownloadPortfolio(c *gin.Context) {
	id := c.Param("uuid")
	var portfolio models.Portfolio

	if err := database.DB.Where("id = ?", id).First(&portfolio).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Portfolio not found"})
		return
	}

	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", portfolio.OriginalFileName))
	c.Header("Content-Type", "application/pdf")
	c.File(portfolio.FilePath)
}
