'use strict';

import * as vscode from 'vscode';
let uuid = require('node-uuid');


export default class SpPnpIntellisense implements vscode.CodeActionProvider {

    private diagnosticCollection: vscode.DiagnosticCollection;
    

    public activate(subscriptions: vscode.Disposable[]) {
        console.log('Attivazione plugin!');
        let cmdReplaceAllGuids = vscode.commands.registerCommand('pnp.replace_all_guids', this.replaceAllGuids);
        let cmdReplaceGuid = vscode.commands.registerCommand('pnp.replace_guid', this.replaceGuid);
		subscriptions.push(cmdReplaceAllGuids);
		subscriptions.push(cmdReplaceGuid);
        
		this.diagnosticCollection = vscode.languages.createDiagnosticCollection();

        vscode.workspace.onDidOpenTextDocument(this.showDiagnostics, this, subscriptions);
        vscode.workspace.onDidSaveTextDocument(this.showDiagnostics, this, subscriptions);
        vscode.window.onDidChangeActiveTextEditor(editor => {
            this.showDiagnostics(editor.document);
        }, this, subscriptions);
        vscode.workspace.onDidCloseTextDocument(textDocument => {
            this.diagnosticCollection.delete(textDocument.uri);
        }, null, subscriptions);
    }

    public provideCodeActions(document: vscode.TextDocument, range: vscode.Range, context: vscode.CodeActionContext, token: vscode.CancellationToken): vscode.Command[] {
        let diagnostic: vscode.Diagnostic = context.diagnostics[0];

        let match: string[] = diagnostic.message.match(/##(.+)##/);
        let error: string = '';

        return [{
            title: "Replace this GUID",
            command: 'pnp.replace_guid',
            arguments: [document, diagnostic.range, diagnostic.message]
        }];

    }

    public showDiagnostics(document: vscode.TextDocument) {
        var src : string = document.getText();
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
       
        this.diagnosticCollection.set(document.uri, diagnostics);	
        
    }

    public replaceAllGuids() {
        var editor = vscode.window.activeTextEditor;
        if (!editor) {
            return; // No open text editor
        }

        let src:string = editor.document.getText();
        let regex = new RegExp(/##GUID##/, 'gm');
        let match;
        let count = 0;
        while (match  = regex.exec(src)) {
            let startPos = editor.document.positionAt(match.index);
            let endPos = editor.document.positionAt(match.index + match[0].length);
            let selection = new vscode.Selection(startPos, endPos);
            // editor.selections.push(selection);
            let newGuid = uuid.v4();
            editor.edit(edit => edit.replace(selection, newGuid));
        }
        vscode.window.showInformationMessage('Sostituiti tutti Guid; totale ', count.toString());
        // editor.edit(edit => editor.selections.forEach(v => edit.replace(v, uuid.v4())));
    }

    public replaceGuid(document: vscode.TextDocument, range: vscode.Range, message:string) {

    }

    public dispose(): void {
		this.diagnosticCollection.clear();
		this.diagnosticCollection.dispose();
	}
}