# Build stage
FROM maven:3.9-eclipse-temurin-25 AS build

WORKDIR /build

# Install generative-art-library into local Maven cache
COPY generative_art_library/pom.xml generative_art_library/pom.xml
COPY generative_art_library/src generative_art_library/src
RUN mvn -f generative_art_library/pom.xml install -DskipTests -q

# Build the backend
COPY generative_art_world/pom.xml generative_art_world/pom.xml
RUN mvn -f generative_art_world/pom.xml dependency:go-offline -q
COPY generative_art_world/src generative_art_world/src
COPY generative_art_world/openapi.yml generative_art_world/openapi.yml
RUN mvn -f generative_art_world/pom.xml package -DskipTests -q

# Run stage
FROM eclipse-temurin:25-jre

WORKDIR /app

COPY --from=build /build/generative_art_world/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
