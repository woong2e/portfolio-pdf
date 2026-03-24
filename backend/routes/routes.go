package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/woong/portfolio-pdf/backend/handlers"
	"github.com/woong/portfolio-pdf/backend/middleware"
)

func SetupRoutes(r *gin.Engine) {
	api := r.Group("/api")
	
	// Public 인증 불필요 API 라우트
	portfolio := api.Group("/portfolio")
	{
		portfolio.GET("/:id", handlers.ViewPortfolio)
		portfolio.GET("/:id/download", handlers.DownloadPortfolio)
	}

	// 관리자용 소셜 로그인 인증 라우트
	adminAuth := api.Group("/admin")
	{
		adminAuth.POST("/login", handlers.GoogleLogin)
	}

	// JWT 인증이 필요한 관리자 전용 보호 라우트
	admin := api.Group("/admin")
	admin.Use(middleware.AuthMiddleware())
	{
		admin.GET("/portfolios", handlers.GetPortfolios)
		admin.GET("/portfolio/:id", handlers.GetPortfolio)
		admin.POST("/portfolio", handlers.CreatePortfolio)
		admin.PUT("/portfolio/:id", handlers.UpdatePortfolio)
		admin.DELETE("/portfolio/:id", handlers.DeletePortfolio)
	}
}
