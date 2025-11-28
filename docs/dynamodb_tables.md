# AWS DynamoDB Table Definitions for Anti-Phishing System

## Overview
This document defines DynamoDB tables for high-throughput operations that complement the PostgreSQL relational database.

---

## Table 1: RealTimeScans

**Purpose**: Handle real-time URL scan requests from browser extensions with millisecond latency

### Table Configuration
```yaml
TableName: RealTimeScans
BillingMode: PAY_PER_REQUEST  # Auto-scaling based on demand
StreamEnabled: true           # For real-time analytics
StreamViewType: NEW_AND_OLD_IMAGES
PointInTimeRecoveryEnabled: true
```

### Schema
```json
{
  "AttributeDefinitions": [
    {
      "AttributeName": "url_hash",
      "AttributeType": "S"
    },
    {
      "AttributeName": "timestamp",
      "AttributeType": "N"
    },
    {
      "AttributeName": "user_id",
      "AttributeType": "S"
    },
    {
      "AttributeName": "recommendation",
      "AttributeType": "S"
    }
  ],
  "KeySchema": [
    {
      "AttributeName": "url_hash",
      "KeyType": "HASH"
    },
    {
      "AttributeName": "timestamp",
      "KeyType": "RANGE"
    }
  ],
  "GlobalSecondaryIndexes": [
    {
      "IndexName": "UserScansIndex",
      "KeySchema": [
        {
          "AttributeName": "user_id",
          "KeyType": "HASH"
        },
        {
          "AttributeName": "timestamp",
          "KeyType": "RANGE"
        }
      ],
      "Projection": {
        "ProjectionType": "ALL"
      }
    },
    {
      "IndexName": "ThreatLevelIndex",
      "KeySchema": [
        {
          "AttributeName": "recommendation",
          "KeyType": "HASH"
        },
        {
          "AttributeName": "timestamp",
          "KeyType": "RANGE"
        }
      ],
      "Projection": {
        "ProjectionType": "ALL"
      }
    }
  ],
  "TimeToLiveSpecification": {
    "AttributeName": "ttl",
    "Enabled": true
  }
}
```

### Item Structure
```json
{
  "url_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "timestamp": 1698765432000,
  "original_url": "https://suspicious-bank.com/login",
  "normalized_url": "https://suspicious-bank.com/login",
  "user_id": "user-uuid-123",
  "session_id": "session-uuid-456",
  "source": "browser_extension",
  "scan_result": {
    "algorithm": {
      "score": 0.85,
      "result": "dangerous",
      "components": {
        "domain": 0.92,
        "path": 0.70,
        "subdomain": 0.88
      }
    },
    "safebrowsing": {
      "status": "threats_found",
      "threat_type": "SOCIAL_ENGINEERING"
    },
    "feeds": [
      {
        "name": "APWG",
        "match_type": "exact",
        "severity": "high"
      }
    ],
    "recommendation": "block"
  },
  "response_time_ms": 45,
  "browser_info": {
    "type": "Chrome",
    "version": "119.0.0.0",
    "platform": "Windows"
  },
  "ttl": 1699370232  // Unix timestamp for 7 days from now
}
```

### Access Patterns
1. **Check URL history**: Query by `url_hash`
2. **User scan history**: Query GSI `UserScansIndex` by `user_id`
3. **Recent threats**: Query GSI `ThreatLevelIndex` by `recommendation = "block"`
4. **Cleanup old data**: Automatic via TTL

---

## Table 2: LiveDashboard

**Purpose**: Store real-time aggregated metrics for dashboard display without hitting PostgreSQL

### Table Configuration
```yaml
TableName: LiveDashboard
BillingMode: PAY_PER_REQUEST
StreamEnabled: false
PointInTimeRecoveryEnabled: true
```

### Schema
```json
{
  "AttributeDefinitions": [
    {
      "AttributeName": "metric_type",
      "AttributeType": "S"
    },
    {
      "AttributeName": "timestamp",
      "AttributeType": "N"
    }
  ],
  "KeySchema": [
    {
      "AttributeName": "metric_type",
      "KeyType": "HASH"
    },
    {
      "AttributeName": "timestamp",
      "KeyType": "RANGE"
    }
  ],
  "TimeToLiveSpecification": {
    "AttributeName": "ttl",
    "Enabled": true
  }
}
```

### Item Structure
```json
{
  "metric_type": "hourly_stats",
  "timestamp": 1698762000000,  // Unix timestamp
  "period": "2024-10-31T14:00:00Z",
  "total_scans": 1247,
  "unique_users": 892,
  "threats_detected": 23,
  "threats_blocked": 19,
  "avg_response_time_ms": 52,
  "top_threats": [
    {
      "domain": "fake-paypal.com",
      "count": 8,
      "severity": "high"
    },
    {
      "domain": "phishing-vietinbank.com",
      "count": 5,
      "severity": "critical"
    }
  ],
  "user_actions": {
    "proceeded": 4,
    "blocked": 19,
    "reported": 7
  },
  "sources": {
    "browser_extension": 1100,
    "web_form": 127,
    "api": 20
  },
  "ttl": 1706346000  // 90 days
}
```

---

## Table 3: ExtensionSessions

**Purpose**: Track browser extension sessions and activities for analytics

### Table Configuration
```yaml
TableName: ExtensionSessions
BillingMode: PAY_PER_REQUEST
StreamEnabled: true
PointInTimeRecoveryEnabled: true
```

### Schema
```json
{
  "AttributeDefinitions": [
    {
      "AttributeName": "session_id",
      "AttributeType": "S"
    },
    {
      "AttributeName": "user_id",
      "AttributeType": "S"
    },
    {
      "AttributeName": "session_start",
      "AttributeType": "N"
    }
  ],
  "KeySchema": [
    {
      "AttributeName": "session_id",
      "KeyType": "HASH"
    }
  ],
  "GlobalSecondaryIndexes": [
    {
      "IndexName": "UserSessionsIndex",
      "KeySchema": [
        {
          "AttributeName": "user_id",
          "KeyType": "HASH"
        },
        {
          "AttributeName": "session_start",
          "KeyType": "RANGE"
        }
      ],
      "Projection": {
        "ProjectionType": "ALL"
      }
    }
  ],
  "TimeToLiveSpecification": {
    "AttributeName": "ttl",
    "Enabled": true
  }
}
```

### Item Structure
```json
{
  "session_id": "session-uuid-789",
  "user_id": "user-uuid-123",
  "extension_version": "1.2.3",
  "browser_type": "Chrome",
  "browser_version": "119.0.0.0",
  "platform": "Windows 10",
  "session_start": 1698765432000,
  "session_end": null,  // Updated when session ends
  "urls_checked": 45,
  "threats_detected": 3,
  "threats_blocked": 2,
  "alerts_shown": [
    {
      "timestamp": 1698765500000,
      "url": "https://fake-bank.com",
      "alert_type": "block",
      "user_action": "blocked"
    }
  ],
  "install_date": 1698000000000,
  "ttl": 1706346000
}
```

---

## Table 4: ApiRateLimits

**Purpose**: Track API usage for rate limiting and abuse prevention

### Table Configuration
```yaml
TableName: ApiRateLimits
BillingMode: PAY_PER_REQUEST
StreamEnabled: false
```

### Schema
```json
{
  "AttributeDefinitions": [
    {
      "AttributeName": "identifier",
      "AttributeType": "S"
    }
  ],
  "KeySchema": [
    {
      "AttributeName": "identifier",
      "KeyType": "HASH"
    }
  ],
  "TimeToLiveSpecification": {
    "AttributeName": "ttl",
    "Enabled": true
  }
}
```

### Item Structure
```json
{
  "identifier": "user-uuid-123:2024-10-31",
  "user_id": "user-uuid-123",
  "date": "2024-10-31",
  "scan_count": 47,
  "report_count": 3,
  "last_request": 1698765432000,
  "rate_limit_exceeded": false,
  "ttl": 1698851832  // 24 hours from last request
}
```

---

## CloudFormation Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'DynamoDB tables for Anti-Phishing System'

Resources:
  RealTimeScansTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: AntiPhishing-RealTimeScans
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: url_hash
          AttributeType: S
        - AttributeName: timestamp
          AttributeType: N
        - AttributeName: user_id
          AttributeType: S
        - AttributeName: recommendation
          AttributeType: S
      KeySchema:
        - AttributeName: url_hash
          KeyType: HASH
        - AttributeName: timestamp
          KeyType: RANGE
      GlobalSecondaryIndexes:
        - IndexName: UserScansIndex
          KeySchema:
            - AttributeName: user_id
              KeyType: HASH
            - AttributeName: timestamp
              KeyType: RANGE
          Projection:
            ProjectionType: ALL
        - IndexName: ThreatLevelIndex
          KeySchema:
            - AttributeName: recommendation
              KeyType: HASH
            - AttributeName: timestamp
              KeyType: RANGE
          Projection:
            ProjectionType: ALL
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      TimeToLiveSpecification:
        AttributeName: ttl
        Enabled: true
      Tags:
        - Key: Environment
          Value: Production
        - Key: Application
          Value: AntiPhishing

  LiveDashboardTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: AntiPhishing-LiveDashboard
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: metric_type
          AttributeType: S
        - AttributeName: timestamp
          AttributeType: N
      KeySchema:
        - AttributeName: metric_type
          KeyType: HASH
        - AttributeName: timestamp
          KeyType: RANGE
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      TimeToLiveSpecification:
        AttributeName: ttl
        Enabled: true
      Tags:
        - Key: Environment
          Value: Production
        - Key: Application
          Value: AntiPhishing

  ExtensionSessionsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: AntiPhishing-ExtensionSessions
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: session_id
          AttributeType: S
        - AttributeName: user_id
          AttributeType: S
        - AttributeName: session_start
          AttributeType: N
      KeySchema:
        - AttributeName: session_id
          KeyType: HASH
      GlobalSecondaryIndexes:
        - IndexName: UserSessionsIndex
          KeySchema:
            - AttributeName: user_id
              KeyType: HASH
            - AttributeName: session_start
              KeyType: RANGE
          Projection:
            ProjectionType: ALL
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      TimeToLiveSpecification:
        AttributeName: ttl
        Enabled: true
      Tags:
        - Key: Environment
          Value: Production
        - Key: Application
          Value: AntiPhishing

  ApiRateLimitsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: AntiPhishing-ApiRateLimits
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: identifier
          AttributeType: S
      KeySchema:
        - AttributeName: identifier
          KeyType: HASH
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      TimeToLiveSpecification:
        AttributeName: ttl
        Enabled: true
      Tags:
        - Key: Environment
          Value: Production
        - Key: Application
          Value: AntiPhishing

Outputs:
  RealTimeScansTableName:
    Description: Name of RealTimeScans table
    Value: !Ref RealTimeScansTable
    Export:
      Name: !Sub '${AWS::StackName}-RealTimeScansTable'

  LiveDashboardTableName:
    Description: Name of LiveDashboard table
    Value: !Ref LiveDashboardTable
    Export:
      Name: !Sub '${AWS::StackName}-LiveDashboardTable'

  ExtensionSessionsTableName:
    Description: Name of ExtensionSessions table
    Value: !Ref ExtensionSessionsTable
    Export:
      Name: !Sub '${AWS::StackName}-ExtensionSessionsTable'

  ApiRateLimitsTableName:
    Description: Name of ApiRateLimits table
    Value: !Ref ApiRateLimitsTable
    Export:
      Name: !Sub '${AWS::StackName}-ApiRateLimitsTable'
```

---

## Deployment Instructions

### Using AWS CLI:
```bash
# Deploy CloudFormation stack
aws cloudformation create-stack \
  --stack-name antiphishing-dynamodb \
  --template-body file://dynamodb-tables.yaml \
  --region ap-southeast-1

# Wait for creation
aws cloudformation wait stack-create-complete \
  --stack-name antiphishing-dynamodb \
  --region ap-southeast-1
```

### Using AWS Console:
1. Go to CloudFormation service
2. Click "Create Stack"
3. Upload the template file
4. Follow the wizard to completion

---

## Cost Estimation

**PAY_PER_REQUEST Pricing** (ap-southeast-1 region):
- Write requests: $1.25 per million
- Read requests: $0.25 per million
- Storage: $0.25 per GB-month

**Example Monthly Cost** (moderate usage):
- 5 million read requests: $1.25
- 2 million write requests: $2.50
- 10 GB storage: $2.50
- **Total**: ~$6.25/month

---

## Data Migration Strategy

### From PostgreSQL to DynamoDB (for real-time operations):

```python
import boto3
from datetime import datetime, timedelta

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('AntiPhishing-RealTimeScans')

def migrate_recent_scans(pg_connection):
    """Migrate recent URL checks from PostgreSQL"""
    
    # Get scans from last 7 days
    query = """
        SELECT 
            uc.check_id,
            su.url_hash,
            su.original_url,
            su.normalized_url,
            uc.user_id,
            uc.checked_at,
            uc.algorithm_score,
            uc.algorithm_result,
            uc.safebrowsing_status,
            uc.aggregated_recommendation
        FROM url_checks uc
        JOIN suspicious_urls su ON uc.url_id = su.url_id
        WHERE uc.checked_at >= NOW() - INTERVAL '7 days'
    """
    
    cursor = pg_connection.cursor()
    cursor.execute(query)
    
    for row in cursor:
        item = {
            'url_hash': row[1],
            'timestamp': int(row[5].timestamp() * 1000),
            'original_url': row[2],
            'normalized_url': row[3],
            'user_id': row[4] or 'anonymous',
            'scan_result': {
                'algorithm': {
                    'score': float(row[6]) if row[6] else 0,
                    'result': row[7]
                },
                'safebrowsing': {
                    'status': row[8]
                },
                'recommendation': row[9]
            },
            'ttl': int((datetime.now() + timedelta(days=7)).timestamp())
        }
        
        table.put_item(Item=item)
```

---

## Monitoring & Alarms

### CloudWatch Metrics to Monitor:
1. **ConsumedReadCapacityUnits** - Track read throughput
2. **ConsumedWriteCapacityUnits** - Track write throughput
3. **UserErrors** - Application-level errors
4. **SystemErrors** - DynamoDB service errors
5. **ThrottledRequests** - Rate limiting issues

### Sample Alarm (CloudFormation):
```yaml
HighThrottleAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: DynamoDB-HighThrottle-RealTimeScans
    AlarmDescription: Alert when DynamoDB requests are being throttled
    MetricName: ThrottledRequests
    Namespace: AWS/DynamoDB
    Statistic: Sum
    Period: 300
    EvaluationPeriods: 1
    Threshold: 10
    ComparisonOperator: GreaterThanThreshold
    Dimensions:
      - Name: TableName
        Value: !Ref RealTimeScansTable
```

---

## Best Practices

1. **Use Batch Operations**: Use `BatchWriteItem` for multiple inserts
2. **Optimize Item Size**: Keep items under 400KB
3. **Use Sparse Indexes**: Only index items that need it
4. **Enable TTL**: Automatically delete old data
5. **Monitor Costs**: Set up billing alarms
6. **Use Consistent Reads** only when necessary (costs 2x)
7. **Implement Exponential Backoff** for retries

---

## Integration with Application

### Node.js Example:
```javascript
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

async function recordScan(urlHash, scanResult) {
  const params = {
    TableName: 'AntiPhishing-RealTimeScans',
    Item: {
      url_hash: urlHash,
      timestamp: Date.now(),
      original_url: scanResult.url,
      scan_result: scanResult,
      ttl: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    }
  };
  
  await dynamodb.put(params).promise();
}

async function getUserScanHistory(userId, limit = 50) {
  const params = {
    TableName: 'AntiPhishing-RealTimeScans',
    IndexName: 'UserScansIndex',
    KeyConditionExpression: 'user_id = :uid',
    ExpressionAttributeValues: {
      ':uid': userId
    },
    Limit: limit,
    ScanIndexForward: false // Descending order
  };
  
  const result = await dynamodb.query(params).promise();
  return result.Items;
}
```

---

This completes the DynamoDB table definitions for your anti-phishing system!
