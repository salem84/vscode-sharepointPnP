'use strict';

import * as vscode from 'vscode';

export default class SpPnpIntellisense implements vscode.CodeActionProvider {

    private diagnosticCollection: vscode.DiagnosticCollection;
    private command: vscode.Disposable;
    

    public activate(subscriptions: vscode.Disposable[]) {
        console.log('Attivazione plugin!');
        this.command = vscode.commands.registerCommand('pnp.guids', this.searchGuid, this);
		subscriptions.push(this);
		this.diagnosticCollection = vscode.languages.createDiagnosticCollection();

        vscode.workspace.onDidOpenTextDocument(this.doSearchPlaceholders, this, subscriptions);
        vscode.workspace.onDidSaveTextDocument(this.doSearchPlaceholders, this, subscriptions);
    }

    public provideCodeActions(document: vscode.TextDocument, range: vscode.Range, context: vscode.CodeActionContext, token: vscode.CancellationToken): vscode.Command[] {
        let diagnostic: vscode.Diagnostic = context.diagnostics[0];

        let match: string[] = diagnostic.message.match(/##(.+)##/);
        let error: string = '';

        return undefined;
    }

    public doSearchPlaceholders(textDocument: vscode.TextDocument) {
        var src : string = textDocument.getText();
        var regex = new RegExp(/##(.+)##/, 'gm');
        var match;
        var editor = vscode.window.activeTextEditor;
        let diagnostics: vscode.Diagnostic[] = [];
        while (match  = regex.exec(src)) {

            var startPos = editor.document.positionAt(match.index);
            var endPos = editor.document.positionAt(match.index + match[0].length);
            var range = new vscode.Range(startPos, endPos);

            let message = "Prova";
            let severity = vscode.DiagnosticSeverity.Warning;
            let diagnostic = new vscode.Diagnostic(range, message, severity);
            diagnostics.push(diagnostic);
            }
       
        this.diagnosticCollection.set(textDocument.uri, diagnostics);	
        
    }

    public searchGuid(textDocument: vscode.TextDocument) {
        
    }

    public dispose(): void {
		this.diagnosticCollection.clear();
		this.diagnosticCollection.dispose();
		this.command.dispose();
	}
}