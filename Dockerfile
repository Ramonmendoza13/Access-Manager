# Build stage
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app

# Install Maven
RUN apk add --no-cache maven

# Copy configuration and source code
COPY pom.xml .
COPY src ./src

# Build the application package, skipping tests
RUN mvn package -DskipTests

# Run stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy the built jar from the build stage
COPY --from=build /app/target/access-manager-0.0.1-SNAPSHOT.jar app.jar

# Expose port
EXPOSE 8080

# Execute the jar
ENTRYPOINT ["java", "-jar", "app.jar"]
