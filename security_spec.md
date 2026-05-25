# Security Specification - ATLAS IA

## Data Invariants
1. A conversation must be owned by the user who created it (`uid` check).
2. Messages must belong to a conversation owned by the user.
3. FocoFlow items (tasks, projects, etc.) must be owned by the user.
4. Financial transactions must be owned by the user and have valid amounts.
5. User profiles can only be created/modified by the owner of the UID, except for role promotions which are reserved for admins.

## The Dirty Dozen Payloads

1. **Identity Spoofing (FocoFlow Item)**: User A tries to create a task for User B.
   ```json
   { "uid": "user_B_id", "title": "Evil Task", "category": "task", "id": "task123" }
   ```
2. **Identity Spoofing (Conversation)**: User A tries to read User B's conversation.
   ```javascript
   get("/databases/(default)/documents/conversations/user_b_conv_id")
   ```
3. **Privilege Escalation (User Profile)**: User A tries to set `role: "admin"` on their own profile during creation.
   ```json
   { "uid": "user_A_id", "email": "userA@example.com", "name": "User A", "role": "admin", "createdAt": "2024-01-01" }
   ```
4. **State Shortcutting (Conversation)**: Trying to update a conversation with a forbidden field.
   ```json
   { "uid": "other_user_id" }
   ```
5. **Resource Poisoning (FocoFlow Item)**: Injecting a 1MB string into the `title` field.
   ```json
   { "title": "A".repeat(1024 * 1024) }
   ```
6. **Orphaned Writes (Message)**: Creating a message in a conversation that doesn't exist.
   ```javascript
   create("/databases/(default)/documents/conversations/non_existent/messages/msg1", { ... })
   ```
7. **Type Mismatch (Transaction)**: Sending a string for the `amount` field.
   ```json
   { "amount": "one thousand", "type": "expense", "uid": "userA", "date": 123456 }
   ```
8. **Shadow Update (FocoFlow Item)**: Adding an unrequested `isPremium` field to a task.
   ```json
   { "isPremium": true, "status": "done" }
   ```
9. **PII Leak (User Profile)**: An unauthenticated user tries to list all user profiles.
   ```javascript
   list("/databases/(default)/documents/users")
   ```
10. **Bypassing Verification**: User with unverified email tries to write data.
    ```javascript
    request.auth.token.email_verified == false
    ```
11. **Immutable Field Attack**: Trying to change `createdAt` on an existing item.
    ```json
    { "createdAt": 100 }
    ```
12. **Status Lock Bypass**: Trying to change a goal after it's marked as `completed` (if terminal states are enforced).

## Test Runner (firestore.rules.test.ts)
(To be implemented if requested, usually we just focus on the rules)
