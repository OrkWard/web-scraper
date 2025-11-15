package twitter

import (
	"regexp"
	"strconv"
)

type videoAttr struct {
	id  string
	url string
}

func filterOutDuplicateVideo(videoList []string) []string {
	videoAttrList := make([]videoAttr, 0, len(videoList))
	idReg := regexp.MustCompile(`ext_tw_video/(\d+)/`)
	for _, v := range videoList {
		match := idReg.FindStringSubmatch(v)
		if len(match) > 1 {
			videoAttrList = append(videoAttrList, videoAttr{id: match[1], url: v})
		}
	}

	groupedVideos := make(map[string][]string)
	for _, attr := range videoAttrList {
		groupedVideos[attr.id] = append(groupedVideos[attr.id], attr.url)
	}

	filteredVideoList := make([]string, 0, len(groupedVideos))
	for _, sameVideos := range groupedVideos {
		if len(sameVideos) == 0 {
			continue
		}
		filteredVideoList = append(filteredVideoList, pickHighestResolutionVideo(sameVideos))
	}

	return filteredVideoList
}

func pickHighestResolutionVideo(vList []string) string {
	if len(vList) == 0 {
		return ""
	}

	resolutionReg := regexp.MustCompile(`/(\d+)x(\d+)/`)
	highestResolution := 0
	highestIndex := 0

	for i, v := range vList {
		match := resolutionReg.FindStringSubmatch(v)
		if len(match) > 2 {
			width, _ := strconv.Atoi(match[1])
			height, _ := strconv.Atoi(match[2])
			currentResolution := width * height
			if currentResolution > highestResolution {
				highestResolution = currentResolution
				highestIndex = i
			}
		}
	}
	return vList[highestIndex]
}
