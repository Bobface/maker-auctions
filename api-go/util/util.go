package util

// IndexOfUint64 returns the index of the first occurence of an uint in a slice
func IndexOfUint64(slice []uint64, elem uint64) int {
	for i, e := range slice {
		if e == elem {
			return i
		}
	}

	return -1
}

// FilterUint64 an slice
func FilterUint64(slice []uint64, check func(int, uint64) bool) []uint64 {
	ret := []uint64{}
	for i, elem := range slice {
		if check(i, elem) {
			ret = append(ret, elem)
		}
	}
	return ret
}
