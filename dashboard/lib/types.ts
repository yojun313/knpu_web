export interface BugBoardSchema {
  uid: string
  writerUid: string
  writerName: string
  versionName: string
  bugTitle: string
  bugText: string
  datetime: Date
  programLog: string
}

export interface UserSchema {
  _id?: string
  uid: string
  name: string
  email: string
  pushoverKey?: string
  device_list?: string[]
}

export interface UserLogEntry {
  time: string
  message: string
}

export interface UserLogSchema {
  _id: string
  uid: string
  [date: string]: any // Dynamic date keys with arrays of log entries
}
