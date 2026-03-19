--[[
  Hello World Lua Script
  
  Purpose: Test the LuaRunnerService pipeline before writing game logic.
  This script validates that:
  1. Scripts are loaded from the filesystem
  2. Redis EVALSHA works correctly
  3. Keys and arguments are passed properly
  
  Usage:
    keys[1] = "test:key"
    args[1] = value to set
    
  Returns: "OK" if successful
]]

local key = KEYS[1]
local value = ARGV[1] or "hello"

redis.call('SET', key, value)
local result = redis.call('GET', key)

return result
