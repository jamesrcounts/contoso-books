import { useState, useEffect } from 'react';

export const useBooks = (rating, format, genre) => {
    const [isLoading, setIsLoading] = useState(true);
    const [books, setBooks] = useState([]);
    const [page, setPage] = useState(0);
    const [sortby, setSortBy] = useState("");

    function handleScroll() {
        if (window.innerHeight+ window.scrollY < document.body.offsetHeight) return;
        setPage(page => page+1);
    }

    useEffect(() => {
        const loadBooks = async () => {
            const fetchUrl = "/books?limit=20&page=" + page + "&rating=" + rating + "&format=" + format + "&genre=" + genre + "&sortby=" + sortby;
            const response = await fetch(fetchUrl);
            const new_books = await response.json();
            setBooks(old_books => {
                    return page===0? [...new_books] : [...old_books, ...new_books]
            });
            setIsLoading(false);
        }

        loadBooks();
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [page, sortby, rating, format, genre]);

    useEffect(() => {
        setPage(0);
    }, [sortby]);

    useEffect(() => {
        setSortBy("");
        setPage(0);
    }, [rating, format, genre]);

    return { isLoading, books, sortby, setSortBy };
}