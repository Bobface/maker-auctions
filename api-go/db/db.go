package db

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"

	"../global"
)

// DB defines a file db
type DB struct {
	path string
}

// New returns a new db instance
func New(name string) DB {

	if global.IsWebtest() {
		name = fmt.Sprintf("%s_webtest", name)
	}

	path := fmt.Sprintf("db/files/%s.json", name)

	if global.IsWebtest() && fileExists(path) {
		os.Remove(path)
	}

	if !fileExists(path) {
		file, err := os.Create(path)
		if err != nil {
			panic(err)
		}
		file.Close()
	}

	return DB{
		path: path,
	}
}

// Read reads file content and returns it as string
func (db DB) Read() string {
	content, err := ioutil.ReadFile(db.path)
	if err != nil {
		panic(err)
	}

	return string(content)
}

// WriteJSON writes json to file
func (db DB) WriteJSON(content interface{}) {
	str, err := json.Marshal(content)
	if err != nil {
		panic(err)
	}
	db.Write(string(str))
}

// Write writes string to file
func (db DB) Write(content string) {
	err := ioutil.WriteFile(db.path, []byte(content), 0644)
	if err != nil {
		panic(err)
	}
}

func fileExists(path string) bool {
	_, err := os.Stat(path)
	if os.IsNotExist(err) {
		return false
	}
	return true
}
