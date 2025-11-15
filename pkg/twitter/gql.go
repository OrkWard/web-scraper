package twitter

import (
	"errors"
	"fmt"
	"io"
	"net/http"

	"github.com/t14raptor/go-fast/ast"
	"github.com/t14raptor/go-fast/parser"
)

type GQLClient struct {
	ast *ast.Program
}

type NewGQLClientResult struct {
	client *GQLClient
	err    error
}

func NewGQLClient(httpClient *http.Client) <-chan NewGQLClientResult {
	resultCh := make(chan NewGQLClientResult)

	sendError := func(err error) {
		resultCh <- NewGQLClientResult{
			err: err,
		}
	}

	go func() {
		req, err := http.NewRequest("GET", "https://abs.twimg.com/responsive-web/client-web/main.3eb0a9ba.js", nil)
		if err != nil {
			sendError(err)
			return
		}
		resp, err := httpClient.Do(req)
		if err != nil {
			sendError(err)
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			io.ReadAll(resp.Body)
			sendError(fmt.Errorf("HTTP status error: %d", resp.StatusCode))
			return
		}

		bytes, err := io.ReadAll(resp.Body)
		if err != nil {
			sendError(err)
		}

		ast, err := parser.ParseFile(string(bytes))
		if err != nil {
			sendError(err)
		}

		client := &GQLClient{}

		client.ast = ast
		resultCh <- NewGQLClientResult{
			client: client,
		}
	}()

	return resultCh
}

type Visitor struct {
	ast.NoopVisitor
	err          error
	functionName string
	queryId      string
}

func (v *Visitor) VisitObjectLiteral(l *ast.ObjectLiteral) {
	isDefine := false
	for _, prop := range l.Value {
		propKeyed, ok := prop.Prop.(*ast.PropertyKeyed)
		if !ok {
			continue
		}

		key, ok := propKeyed.Key.Expr.(*ast.StringLiteral)
		if !ok || key.Value != "operationName" {
			continue
		}

		value, ok := propKeyed.Value.Expr.(*ast.StringLiteral)
		if ok && value.Value == v.functionName {
			isDefine = true
			break
		}
	}

	if !isDefine {
		return
	}

	for _, prop := range l.Value {
		propKeyed, ok := prop.Prop.(*ast.PropertyKeyed)
		if !ok {
			continue
		}

		key, ok := propKeyed.Key.Expr.(*ast.StringLiteral)
		if !ok || key.Value != "queryId" {
			continue
		}

		value, ok := propKeyed.Value.Expr.(*ast.StringLiteral)
		if ok {
			v.queryId = value.Value
			return
		}
	}
}

func (c *GQLClient) getQueryId(funcName string) (string, error) {
	if c.ast == nil {
		return "", errors.New("GQLClient not init")
	}

	visitor := &Visitor{
		functionName: funcName,
	}
	visitor.V = visitor
	c.ast.VisitWith(visitor)

	if visitor.err != nil {
		return "", visitor.err
	}

	return visitor.queryId, nil
}
