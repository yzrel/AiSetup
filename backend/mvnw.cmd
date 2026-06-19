@echo off
setlocal

set "MAVEN_PROJECTBASEDIR=%~dp0"
if "%MAVEN_PROJECTBASEDIR:~-1%"=="\" set "MAVEN_PROJECTBASEDIR=%MAVEN_PROJECTBASEDIR:~0,-1%"

set "WRAPPER_JAR=%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.jar"
set WRAPPER_LAUNCHER=org.apache.maven.wrapper.MavenWrapperMain

if not exist "%WRAPPER_JAR%" (
  echo Downloading Maven Wrapper...
  if not exist "%MAVEN_PROJECTBASEDIR%\.mvn\wrapper" mkdir "%MAVEN_PROJECTBASEDIR%\.mvn\wrapper"
  powershell -NoProfile -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.3.2/maven-wrapper-3.3.2.jar' -OutFile '%WRAPPER_JAR%'"
)

if not exist "%WRAPPER_JAR%" (
  echo Error: Could not download maven-wrapper.jar
  exit /b 1
)

if exist "%MAVEN_PROJECTBASEDIR%\.jdk\bin\java.exe" (
  set "JAVA_EXE=%MAVEN_PROJECTBASEDIR%\.jdk\bin\java.exe"
) else (
  set "JAVA_EXE=java"
  where java >nul 2>&1
  if errorlevel 1 (
    echo Error: Java 17+ not found.
    echo Run: npm run backend:setup
    exit /b 1
  )
)

"%JAVA_EXE%" ^
  %MAVEN_OPTS% ^
  %JVM_CONFIG_MAVEN_PROPS% ^
  -classpath "%WRAPPER_JAR%" ^
  "-Dmaven.multiModuleProjectDirectory=%MAVEN_PROJECTBASEDIR%" ^
  %WRAPPER_LAUNCHER% %*

if errorlevel 1 exit /b 1
endlocal
