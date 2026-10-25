package com.moyora.clubschedule.vo;

import java.util.List;

public class PagingResponse<T> {
    private long totalCount;
    private int currentPage;
    private int size;
    private int totalPages;
    private int startPage;
    private int endPage;
    private List<T> items;

    public PagingResponse() {}

    public PagingResponse(long totalCount, int currentPage, int size, List<T> items) {
        this.totalCount = totalCount;
        this.currentPage = currentPage;
        this.size = size;
        this.items = items;
        this.totalPages = (int) ((totalCount + size - 1) / size);
        // simple block pagination: show 5 pages per block
        int blockSize = 5;
        int currentBlock = (currentPage - 1) / blockSize;
        this.startPage = currentBlock * blockSize + 1;
        this.endPage = Math.min(this.startPage + blockSize - 1, this.totalPages);
    }

    // getters and setters
    public long getTotalCount() { return totalCount; }
    public void setTotalCount(long totalCount) { this.totalCount = totalCount; }
    public int getCurrentPage() { return currentPage; }
    public void setCurrentPage(int currentPage) { this.currentPage = currentPage; }
    public int getSize() { return size; }
    public void setSize(int size) { this.size = size; }
    public int getTotalPages() { return totalPages; }
    public void setTotalPages(int totalPages) { this.totalPages = totalPages; }
    public int getStartPage() { return startPage; }
    public void setStartPage(int startPage) { this.startPage = startPage; }
    public int getEndPage() { return endPage; }
    public void setEndPage(int endPage) { this.endPage = endPage; }
    public List<T> getItems() { return items; }
    public void setItems(List<T> items) { this.items = items; }
}
