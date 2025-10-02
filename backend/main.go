package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math"
	"math/rand"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

// Service represents a microservice
type Service struct {
	Name         string   `json:"name"`
	CPU          float64  `json:"cpu"`
	Memory       float64  `json:"memory"`
	Latency      int      `json:"latency"`
	Availability float64  `json:"availability"`
	ErrorRate    float64  `json:"error_rate"`
	Throughput   int      `json:"throughput"`
	Status       string   `json:"status"`
	Dependencies []string `json:"dependencies"`
	ActiveChaos  *Chaos   `json:"active_chaos,omitempty"`
}

// Chaos represents active chaos
type Chaos struct {
	Type     string `json:"type"`
	Duration int    `json:"duration"`
	EndTime  int64  `json:"end_time"`
}

// Prediction for AI model
type Prediction struct {
	ServiceName         string  `json:"service_name"`
	IncidentProbability float64 `json:"incident_probability"`
	RiskLevel           string  `json:"risk_level"`
	Confidence          float64 `json:"confidence"`
	PredictedType       string  `json:"predicted_incident_type"`
	Recommendation      string  `json:"recommendation"`
	ModelVersion        string  `json:"model_version"`
}

var (
	services  = make(map[string]*Service)
	wsClients = make(map[*websocket.Conn]bool)
	upgrader  = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool { return true },
	}
)

func initServices() {
	services = map[string]*Service{
		"api-gateway": {
			Name:         "API Gateway",
			CPU:          35.0,
			Memory:       45.0,
			Latency:      250,
			Availability: 99.9,
			ErrorRate:    0.5,
			Throughput:   120,
			Status:       "healthy",
			Dependencies: []string{"auth-service", "user-service"},
		},
		"auth-service": {
			Name:         "Auth Service",
			CPU:          30.0,
			Memory:       40.0,
			Latency:      150,
			Availability: 99.8,
			ErrorRate:    0.8,
			Throughput:   110,
			Status:       "healthy",
			Dependencies: []string{"database"},
		},
		"user-service": {
			Name:         "User Service",
			CPU:          25.0,
			Memory:       35.0,
			Latency:      120,
			Availability: 99.9,
			ErrorRate:    0.3,
			Throughput:   115,
			Status:       "healthy",
			Dependencies: []string{"database"},
		},
		"database": {
			Name:         "Database",
			CPU:          40.0,
			Memory:       60.0,
			Latency:      180,
			Availability: 99.95,
			ErrorRate:    0.2,
			Throughput:   100,
			Status:       "healthy",
			Dependencies: []string{},
		},
	}
}

// Get all services
func getServices(c *gin.Context) {
	c.JSON(200, services)
}

// ML Proxy - tries ML model first, falls back to simple prediction
func proxyMLRequest(c *gin.Context) {
	serviceName := c.Param("service")

	// Build features for ML model
	features := make(map[string]float64)

	// Add time features
	now := time.Now()
	features["hour_of_day"] = float64(now.Hour())
	features["is_peak_hour"] = 0
	if now.Hour() >= 9 && now.Hour() <= 17 {
		features["is_peak_hour"] = 1
	}
	features["is_weekend"] = 0
	if now.Weekday() == time.Saturday || now.Weekday() == time.Sunday {
		features["is_weekend"] = 1
	}

	// Add service metrics
	for name, service := range services {
		prefix := strings.ReplaceAll(name, "-", "_")
		features[prefix+"_cpu"] = service.CPU
		features[prefix+"_memory"] = service.Memory
		features[prefix+"_latency"] = float64(service.Latency)
		features[prefix+"_availability"] = service.Availability
		features[prefix+"_error_rate"] = service.ErrorRate
		features[prefix+"_throughput"] = float64(service.Throughput)
	}

	// Add topology features
	features["dependency_health_score"] = calculateDependencyHealth()
	features["cascade_risk"] = calculateCascadeRisk()
	features["slo_violation_count"] = float64(countSLOViolations())
	features["critical_path_latency"] = calculateCriticalPathLatency()

	// Try calling ML service
	jsonData, _ := json.Marshal(features)
	resp, err := http.Post("http://localhost:5001/predict", "application/json", bytes.NewBuffer(jsonData))

	if err != nil || resp.StatusCode != 200 {
		// Fallback to simple prediction
		getFallbackPrediction(c, serviceName)
		return
	}

	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	c.Data(200, "application/json", body)
}

func calculateDependencyHealth() float64 {
	totalHealth := 0.0
	count := 0.0
	for _, service := range services {
		if service.Status == "down" {
			totalHealth += 0
		} else {
			totalHealth += service.Availability
		}
		count++
	}
	if count == 0 {
		return 99.9
	}
	return totalHealth / count
}

func calculateCascadeRisk() float64 {
	risk := 0.0
	if db, exists := services["database"]; exists {
		if db.Status == "down" || db.Availability == 0 {
			risk = 1.0
		} else {
			if db.CPU > 80 {
				risk += 0.4
			}
			if db.ErrorRate > 5 {
				risk += 0.3
			}
			if db.Availability < 95 {
				risk += 0.3
			}
		}
	}
	return math.Min(risk, 1.0)
}

func countSLOViolations() int {
	violations := 0
	for _, service := range services {
		if service.Latency > 500 {
			violations++
		}
		if service.Availability < 99.9 {
			violations++
		}
		if service.ErrorRate > 1.0 {
			violations++
		}
		if service.Throughput < 100 {
			violations++
		}
	}
	return violations
}

func calculateCriticalPathLatency() float64 {
	maxLatency := 0
	for _, service := range services {
		if service.Latency > maxLatency {
			maxLatency = service.Latency
		}
	}
	return math.Min(float64(maxLatency), 2000.0)
}

// Fallback prediction
func getFallbackPrediction(c *gin.Context, serviceName string) {
	service, exists := services[serviceName]
	if !exists {
		// System-wide prediction
		prediction := getSystemPrediction()
		c.JSON(200, prediction)
		return
	}

	prob := 0.1
	riskLevel := "low"
	incidentType := "none"
	recommendation := "System stable"

	if service.Status == "down" {
		prob = 0.99
		riskLevel = "critical"
		incidentType = "service_failure"
		recommendation = "Service is down! Immediate action required!"
	} else {
		if service.CPU > 85 {
			prob += 0.3
			incidentType = "cpu_overload"
		}
		if service.Memory > 90 {
			prob += 0.3
			incidentType = "memory_leak"
		}
		if service.ErrorRate > 5 {
			prob += 0.2
			incidentType = "high_errors"
		}
		if service.Latency > 1000 {
			prob += 0.2
			incidentType = "high_latency"
		}

		if prob > 0.7 {
			riskLevel = "critical"
			recommendation = "Critical! Immediate action required!"
		} else if prob > 0.5 {
			riskLevel = "high"
			recommendation = "High risk. Scale resources."
		} else if prob > 0.3 {
			riskLevel = "medium"
			recommendation = "Monitor closely."
		}
	}

	c.JSON(200, Prediction{
		ServiceName:         serviceName,
		IncidentProbability: math.Min(prob, 1.0),
		RiskLevel:           riskLevel,
		Confidence:          0.75,
		PredictedType:       incidentType,
		Recommendation:      recommendation,
		ModelVersion:        "fallback_v1",
	})
}

func getSystemPrediction() Prediction {
	avgCPU := 0.0
	avgErrorRate := 0.0
	anyDown := false
	count := 0.0

	for _, s := range services {
		avgCPU += s.CPU
		avgErrorRate += s.ErrorRate
		count++
		if s.Status == "down" {
			anyDown = true
		}
	}

	if count > 0 {
		avgCPU /= count
		avgErrorRate /= count
	}

	prob := 0.1
	riskLevel := "low"

	if anyDown {
		prob = 0.95
		riskLevel = "critical"
	} else if avgCPU > 70 || avgErrorRate > 3 {
		prob = 0.5
		riskLevel = "medium"
	}

	return Prediction{
		ServiceName:         "system",
		IncidentProbability: prob,
		RiskLevel:           riskLevel,
		Confidence:          0.80,
		PredictedType:       "system_health",
		Recommendation:      "System monitoring",
		ModelVersion:        "fallback_v1",
	}
}

// Inject chaos
func injectChaos(c *gin.Context) {
	var req struct {
		TargetService string `json:"target_service"`
		ChaosType     string `json:"chaos_type"`
		Duration      int    `json:"duration"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	service, exists := services[req.TargetService]
	if !exists {
		c.JSON(404, gin.H{"error": "Service not found"})
		return
	}

	service.ActiveChaos = &Chaos{
		Type:     req.ChaosType,
		Duration: req.Duration,
		EndTime:  time.Now().Unix() + int64(req.Duration),
	}

	switch req.ChaosType {
	case "cpu_spike":
		service.CPU = math.Min(service.CPU+30, 95)
		service.Latency += 200
	case "memory_leak":
		service.Memory = math.Min(service.Memory+40, 95)
		service.ErrorRate = math.Min(service.ErrorRate+10, 50)
	case "network_latency":
		service.Latency += 1000
		service.Availability = math.Max(service.Availability-20, 50)
	case "service_kill":
		service.Status = "down"
		service.Availability = 0
		service.ErrorRate = 100
		service.Latency = 9999
		if req.TargetService == "database" {
			for name, svc := range services {
				if name != "database" {
					svc.Status = "down"
					svc.Availability = 0
					svc.ErrorRate = 100
				}
			}
		}
	}

	updateStatus(service)
	broadcastUpdate()

	go func() {
		time.Sleep(time.Duration(req.Duration) * time.Second)
		service.ActiveChaos = nil
		resetServiceToHealthy(req.TargetService)
		broadcastUpdate()
	}()

	c.JSON(200, gin.H{"status": "chaos injected"})
}

func resetServiceToHealthy(serviceName string) {
	service, exists := services[serviceName]
	if !exists {
		return
	}

	service.CPU = 30 + rand.Float64()*15
	service.Memory = 35 + rand.Float64()*15
	service.Latency = 100 + rand.Intn(100)
	service.Availability = 99.5 + rand.Float64()*0.5
	service.ErrorRate = rand.Float64() * 0.5
	service.Throughput = 100 + rand.Intn(50)
	service.Status = "healthy"
	service.ActiveChaos = nil

	if serviceName == "database" {
		for name := range services {
			if name != "database" {
				resetServiceToHealthy(name)
			}
		}
	}
}

func updateStatus(service *Service) {
	if service.Availability == 0 || service.ErrorRate >= 100 {
		service.Status = "down"
	} else if service.CPU > 90 || service.Memory > 90 || service.ErrorRate > 10 || service.Latency > 1000 {
		service.Status = "degraded"
	} else {
		service.Status = "healthy"
	}
}

func resetServices(c *gin.Context) {
	for name := range services {
		resetServiceToHealthy(name)
	}
	broadcastUpdate()
	c.JSON(200, gin.H{"status": "reset"})
}

func wsHandler(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}
	defer conn.Close()

	wsClients[conn] = true

	data, _ := json.Marshal(services)
	conn.WriteMessage(websocket.TextMessage, data)

	for {
		if _, _, err := conn.ReadMessage(); err != nil {
			delete(wsClients, conn)
			break
		}
	}
}

func broadcastUpdate() {
	data, _ := json.Marshal(services)
	for conn := range wsClients {
		if err := conn.WriteMessage(websocket.TextMessage, data); err != nil {
			conn.Close()
			delete(wsClients, conn)
		}
	}
}

func startMetricsUpdater() {
	go func() {
		ticker := time.NewTicker(2 * time.Second)
		defer ticker.Stop()

		for range ticker.C {
			now := time.Now().Unix()
			for _, service := range services {
				if service.ActiveChaos != nil && now > service.ActiveChaos.EndTime {
					service.ActiveChaos = nil
				}

				if service.ActiveChaos == nil && service.Status != "down" {
					service.CPU += (rand.Float64() - 0.5) * 2
					service.CPU = math.Max(10, math.Min(service.CPU, 100))

					service.Memory += (rand.Float64() - 0.5) * 1.5
					service.Memory = math.Max(20, math.Min(service.Memory, 100))

					service.Latency += int((rand.Float64() - 0.5) * 10)
					service.Latency = int(math.Max(50, math.Min(float64(service.Latency), 2000)))

					updateStatus(service)
				}
			}
			broadcastUpdate()
		}
	}()
}

func main() {
	initServices()
	startMetricsUpdater()

	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Serve static files from React build
	r.Static("/assets", "./static/assets")
	r.StaticFile("/", "./static/index.html")
	r.NoRoute(func(c *gin.Context) {
		c.File("./static/index.html")
	})

	// API routes
	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "healthy"})
	})
	r.GET("/api/services", getServices)
	r.GET("/api/predict/:service", proxyMLRequest)
	r.GET("/api/predict", proxyMLRequest)
	r.POST("/api/chaos/inject", injectChaos)
	r.POST("/api/reset", resetServices)
	r.GET("/ws", wsHandler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("Server starting on port %s\n", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
