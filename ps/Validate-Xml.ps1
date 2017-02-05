function Test-XmlSchema {
    param
    (
        [Parameter(Mandatory = $true)]
        [ValidateScript({Test-Path $_})]
        [String]
        $XmlPath,
       
        [Parameter(Mandatory = $true)]
        [ValidateScript({Test-Path $_})]
        [String]
        $SchemaPath
    )

    $schemas = New-Object System.Xml.Schema.XmlSchemaSet
    $schemas.CompilationSettings.EnableUpaCheck = $false
    $schema = ReadSchema $SchemaPath
    [void]($schemas.Add($schema))
    $schemas.Compile()
      
    # try {
        [xml]$xmlData = Get-Content $XmlPath
        $xmlData.Schemas = $schemas

        $handler = [System.Xml.Schema.ValidationEventHandler] {
            $args = $_ # entering new block so copy $_
            switch ($args.Severity) {
                Error {
                    # Exception is an XmlSchemaException
                    Write-Host "ERROR: line $($args.Exception.LineNumber)" -nonewline -ForegroundColor Red
                    Write-Host " position $($args.Exception.LinePosition)" -ForegroundColor Red
                    Write-Host $args.Message -ForegroundColor Red
                    Write-Host " "
                    $global:validationSuccess = $false
                    break
                }
                Warning {
                    # So far, everything that has caused the handler to fire, has caused an Error...
                    Write-Host "Warning:: Check that the schema location references are joined up properly."
                    Write-Host " "
                    break
                }
            }
        }

        #Validate the schema. This will fail if is invalid schema
        #$xmlData.Validate($null)
        $xmlData.Validate($handler)        
        return $global:validationSuccess
    # }
    # catch [System.Xml.Schema.XmlSchemaValidationException] {
    #     Write-Host $_.Exception.Message -ForegroundColor Red
    #     return $false
    # }
}

Function ReadSchema {
    param($SchemaPath)
    try {
        $schemaItem = Get-Item $SchemaPath
        $stream = $schemaItem.OpenRead()
        $schema = [Xml.Schema.XmlSchema]::Read($stream, $null)
        return $schema
    }
    catch {
        throw
    }
    finally {
        if($stream) {
            $stream.Close()
        }
    }
}