package twitter_scraper

import (
	"sync"
)

var (
	mu           sync.Mutex
	currentIndex int
)

var chars = []rune{'/', '-', '\\', '|'}

func GetChar() rune {
	mu.Lock()
	defer mu.Unlock()

	char := chars[currentIndex%len(chars)]
	currentIndex++
	return char
}
