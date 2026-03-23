package utils

import (
	"strings"
	"testing"
)

const expectedLength = 16

func TestGenerateShortID_Length(t *testing.T) {
	id := GenerateShortID(expectedLength)
	if len(id) != expectedLength {
		t.Errorf("생성된 ID 길이 %d, 기대값 %d", len(id), expectedLength)
	}
}

func TestGenerateShortID_CustomLength(t *testing.T) {
	lengths := []int{4, 8, 12, 16, 20}
	for _, l := range lengths {
		id := GenerateShortID(l)
		if len(id) != l {
			t.Errorf("길이 %d 요청 시 생성된 ID 길이 %d", l, len(id))
		}
	}
}

func TestGenerateShortID_CharsetOnly(t *testing.T) {
	id := GenerateShortID(expectedLength)
	for _, c := range id {
		if !strings.ContainsRune(charset, c) {
			t.Errorf("허용되지 않는 문자 포함: %c", c)
		}
	}
}

func TestGenerateShortID_Uniqueness(t *testing.T) {
	seen := make(map[string]bool)
	for i := 0; i < 1000; i++ {
		id := GenerateShortID(expectedLength)
		if seen[id] {
			t.Errorf("충돌 발생: %s", id)
		}
		seen[id] = true
	}
}

func TestGenerateShortID_ShorterThanUUID(t *testing.T) {
	const uuidLength = 36
	id := GenerateShortID(expectedLength)
	if len(id) >= uuidLength {
		t.Errorf("공유 링크 ID(%d자)가 UUID(%d자)보다 짧아야 합니다", len(id), uuidLength)
	}
}
