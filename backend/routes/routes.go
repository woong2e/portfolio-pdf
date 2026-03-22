package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/woong/portfolio-pdf/backend/handlers"
	"github.com/woong/portfolio-pdf/backend/middleware"
)

func SetupRoutes(r *gin.Engine) {
	api := r.Group("/api")
	
	// Public Routes
	portfolio := api.Group("/portfolio")
	{
		portfolio.GET("/:uuid", handlers.ViewPortfolio)
		portfolio.GET("/:uuid/download", handlers.DownloadPortfolio)
	}

	// Admin Auth Route
	adminAuth := api.Group("/admin")
	{
		adminAuth.POST("/login", handlers.GoogleLogin)
	}

	// Admin Protected Routes
	admin := api.Group("/admin")
	admin.Use(middleware.AuthMiddleware())
	{
		admin.GET("/portfolios", handlers.GetPortfolios)
		admin.GET("/portfolio/:uuid", handlers.GetPortfolio)
		admin.POST("/portfolio", handlers.CreatePortfolio)
		admin.PUT("/portfolio/:uuid", handlers.UpdatePortfolio)
		admin.DELETE("/portfolio/:uuid", handlers.DeletePortfolio)
	}
}
