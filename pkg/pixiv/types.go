package pixiv

// BookmarkResponse represents the response from the bookmark API.
type BookmarkResponse struct {
	Error   bool   `json:"error"`
	Message string `json:"message"`
	Body    struct {
		Works []Work `json:"works"`
		Total int    `json:"total"`
	} `json:"body"`
}

// Work represents a single work (novel) in the bookmark response.
type Work struct {
	ID       string `json:"id"`
	Title    string `json:"title"`
	UserID   string `json:"userId"`
	UserName string `json:"userName"`
}

// NovelResponse represents the response from the novel API.
type NovelResponse struct {
	Error   bool   `json:"error"`
	Message string `json:"message"`
	Body    struct {
		Content    string `json:"content"`
		Title      string `json:"title"`
		UploadDate string `json:"uploadDate"`
	} `json:"body"`
}
