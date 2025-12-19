package com.manshicoaching

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.provider.OpenableColumns
import com.facebook.react.bridge.*

class FilePickerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext), ActivityEventListener {
    
    private var pickerPromise: Promise? = null
    
    init {
        reactContext.addActivityEventListener(this)
    }
    
    override fun getName(): String = "FilePicker"
    
    @ReactMethod
    fun pickFile(promise: Promise) {
        val activity = currentActivity
        if (activity == null) {
            promise.reject("E_ACTIVITY_DOES_NOT_EXIST", "Activity doesn't exist")
            return
        }
        
        pickerPromise = promise
        
        val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            type = "*/*"
            putExtra(Intent.EXTRA_MIME_TYPES, arrayOf(
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "image/*"
            ))
        }
        
        activity.startActivityForResult(intent, PICK_FILE_REQUEST)
    }
    
    override fun onActivityResult(activity: Activity?, requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode != PICK_FILE_REQUEST) return
        
        val promise = pickerPromise ?: return
        pickerPromise = null
        
        if (resultCode != Activity.RESULT_OK || data == null) {
            promise.reject("E_PICKER_CANCELLED", "User cancelled")
            return
        }
        
        val uri = data.data
        if (uri == null) {
            promise.reject("E_NO_FILE", "No file selected")
            return
        }
        
        try {
            val result = Arguments.createMap()
            result.putString("uri", uri.toString())
            result.putString("name", getFileName(uri))
            result.putString("type", getFileType(uri))
            result.putDouble("size", getFileSize(uri).toDouble())
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("E_FILE_ERROR", e.message)
        }
    }
    
    override fun onNewIntent(intent: Intent?) {}
    
    private fun getFileName(uri: Uri): String {
        var name = "unknown"
        reactApplicationContext.contentResolver.query(uri, null, null, null, null)?.use { cursor ->
            val nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
            if (cursor.moveToFirst() && nameIndex >= 0) {
                name = cursor.getString(nameIndex)
            }
        }
        return name
    }
    
    private fun getFileType(uri: Uri): String {
        return reactApplicationContext.contentResolver.getType(uri) ?: "application/octet-stream"
    }
    
    private fun getFileSize(uri: Uri): Long {
        var size = 0L
        reactApplicationContext.contentResolver.query(uri, null, null, null, null)?.use { cursor ->
            val sizeIndex = cursor.getColumnIndex(OpenableColumns.SIZE)
            if (cursor.moveToFirst() && sizeIndex >= 0) {
                size = cursor.getLong(sizeIndex)
            }
        }
        return size
    }
    
    companion object {
        private const val PICK_FILE_REQUEST = 9001
    }
}
