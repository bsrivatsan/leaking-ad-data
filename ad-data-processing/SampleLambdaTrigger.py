from __future__ import print_function

import boto3
import json

print('Loading function')


def handler(event, context):
    '''Provide an event that contains the following keys:

      - operation: one of the operations in the operations dict below
      - tableName: required for operations that interact with DynamoDB
      - payload: a parameter to pass to the operation being performed
    '''
    #print("Received event: " + json.dumps(event, indent=2))

    operation = event['operation']

    if 'type' in event:
        if event['type'] != "TYPE":
            raise ValueError('Invalid Request Type')
    else:
        raise ValueError('No Request Type')
        
    dynamo = boto3.resource('dynamodb').Table("TABLE")

    operations = {
        'create': lambda x: dynamo.put_item(**x),
        'echo': lambda x: x,
        'ping': lambda x: 'pong'
    }

    if operation in operations:
        return operations[operation](event.get('payload'))
    else:
        raise ValueError('Unrecognized operation "{}"'.format(operation))