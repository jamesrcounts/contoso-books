import { useState, useEffect } from 'react';

export const useNavbarFilters = () => {
    const [rating, setRating] = useState(0);
    const [format, setFormat] = useState("");
    const [genre, setGenre] = useState("");

    return { rating, setRating, format, setFormat, genre, setGenre};
}