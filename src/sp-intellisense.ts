'use strict';

import * as vscode from 'vscode';
let uuid = require('node-uuid');
// let xsd = require('libxml-xsd');


export default class SpPnpIntellisense implements vscode.CodeActionProvider {

    private diagnosticCollection: vscode.DiagnosticCollection;
    private _context: vscode.ExtensionContext;

    public activate(context: vscode.ExtensionContext) {
        this._context = context;

        let subscriptions:vscode.Disposable[] = context.subscriptions;
        
        console.log('Attivazione plugin!');
        let cmdReplaceAllGuids = vscode.commands.registerCommand('pnp.replace_all_guids', this.replaceAllGuids);
        let cmdReplaceGuid = vscode.commands.registerCommand('pnp.replace_guid', this.replaceGuid);
        let cmdValidateXml = vscode.commands.registerCommand('pnp.validate_xml', this.validateXml, this);
		subscriptions.push(cmdReplaceAllGuids);
		subscriptions.push(cmdReplaceGuid);
        subscriptions.push(cmdValidateXml);
        
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
        },
        {
            title: "Replace all GUIDs",
            command: 'pnp.replaceAllGuids',
            arguments: []
        },
        ];

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
        var editor = vscode.window.activeTextEditor;
        if (!editor) {
            return; // No open text editor
        }
        
        let newGuid = uuid.v4();
        editor.edit(edit => edit.replace(range, newGuid));
    }

    public validateXml() {
        var editor = vscode.window.activeTextEditor;
        if (!editor) {
            return; // No open text editor
        }

        let src:string = editor.document.getText();
        
        let xmlPath = vscode.window.activeTextEditor.document.uri.fsPath;
        let xsdPath = this._context.asAbsolutePath('/xsd/ProvisioningSchema-2016-05.xsd');
        let psScript = this._context.asAbsolutePath('/ps/Validate-Xml.ps1');
        let terminal:vscode.Terminal = vscode.window.createTerminal("XML Validation");
        terminal.show(true);
        terminal.sendText(". " + psScript);
        terminal.sendText("Test-XmlSchema -XmlPath " + xmlPath + " -SchemaPath "+ xsdPath);
        

        // var validator = require('xsd-schema-validator');
        
        
        // validator.validateXML(src, this._xsdPath, function(err, result) {
        // if (err) {
        //     throw err;
        // }
        
        // result.valid; // true 
        // });

        /*xsd.parseFile(schemaPath, function(err, schema){
            schema.validate(src, function(err, validationErrors){
                var a ="";
                // err contains any technical error 
                // validationError is an array, null if the validation is ok 
            });  
        });*/
    }

    public dispose(): void {
		this.diagnosticCollection.clear();
		this.diagnosticCollection.dispose();
	}
}